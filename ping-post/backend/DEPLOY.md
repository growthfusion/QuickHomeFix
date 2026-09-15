# Deploying the dashboard API to Cloud Run

This service is read-only over ClickHouse. It never calls LeadProsper —
the sync service owns that path (see `sync/DEPLOY.md`). Deploy both:
sync writes, this reads.

The container also serves the built React UI, so one Cloud Run service
covers both. The browser reaches `/api` same-origin, which means CORS
never applies in production.

## 1. Variables

```bash
PROJECT=your-gcp-project
REGION=us-central1
SERVICE=hsp-api

gcloud config set project $PROJECT
```

## 2. Reuse the sync's secret and service account

The ClickHouse password is already in Secret Manager from the sync
deploy. Don't create a second copy — one secret, rotated in one place.

```bash
SA="hsp-sync@$PROJECT.iam.gserviceaccount.com"
```

If you skipped the sync deploy, create them first:

```bash
gcloud iam service-accounts create hsp-sync --display-name="Ping Post"
printf '%s' 'YOUR_CH_PASSWORD' | gcloud secrets create clickhouse-password --data-file=-
gcloud secrets add-iam-policy-binding clickhouse-password \
  --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor
```

## 3. Deploy

Build context is the `ping-post/` root — the image builds the frontend
and copies it in, so the Dockerfile needs both folders.

```bash
cd ping-post

gcloud run deploy $SERVICE \
  --source . \
  --region $REGION \
  --service-account $SA \
  --allow-unauthenticated \
  --memory 512Mi \
  --min-instances 0 \
  --set-env-vars "CLICKHOUSE_URL=https://YOUR_HOST:8443,CLICKHOUSE_DB=ping_post,CLICKHOUSE_USER=default" \
  --set-secrets "CLICKHOUSE_PASSWORD=clickhouse-password:latest"
```

Cloud Build needs to know which Dockerfile to use, since there are two
in this repo. Either point at it explicitly:

```bash
gcloud builds submit --tag gcr.io/$PROJECT/$SERVICE \
  --file backend/Dockerfile .
gcloud run deploy $SERVICE --image gcr.io/$PROJECT/$SERVICE --region $REGION ...
```

or add a `cloudbuild.yaml` naming `backend/Dockerfile`.

### On `--allow-unauthenticated`

This makes the dashboard publicly reachable. **The responses carry
affiliate payouts and buyer revenue**, so anyone with the URL sees your
margins.

Do not ship it this way. Either:

- Put it behind Identity-Aware Proxy (below), or
- Keep `--no-allow-unauthenticated` and reach it through an
  authenticated proxy.

```bash
gcloud run deploy $SERVICE --no-allow-unauthenticated ...
gcloud iap web enable --resource-type=backend-services --service=$SERVICE
```

Then grant each person `roles/iap.httpsResourceAccessor`.

`ALLOWED_ORIGIN` is not set above on purpose: the UI ships in the same
image and is same-origin. Set it only if you serve the frontend from a
different host.

## 4. Verify

```bash
URL=$(gcloud run services describe $SERVICE --region $REGION --format='value(status.url)')

curl -s "$URL/api/health"
```

A healthy response names the database and the last sync:

```json
{ "ok": true, "source": "clickhouse", "database": "ping_post",
  "last_sync": "2026-09-15 06:46:25" }
```

`last_sync` is the field to watch. A dashboard showing stale figures
looks identical to one showing current ones — if this stops advancing,
the sync service has stopped, not this one.

## 5. Endpoints

All read-only except the last.

| Method | Path                                | Returns                                  |
| ------ | ----------------------------------- | ---------------------------------------- |
| GET    | `/api/health`                       | Liveness + last sync time                |
| GET    | `/api/summary`                      | KPIs, daily trend, top N                 |
| GET    | `/api/affiliates`                   | What we owe each affiliate               |
| GET    | `/api/buyers`                       | What each buyer owes us                  |
| GET    | `/api/buyers/:id/by-affiliate`      | One buyer's leads split by affiliate     |
| GET    | `/api/verticals`                    | Vertical comparison                      |
| GET    | `/api/campaigns`                    | Campaign table                           |
| GET    | `/api/accounting`                   | LeadProsper's own invoice figures        |
| GET    | `/api/leads`                        | Paginated lead table                     |
| GET    | `/api/leads/:id`                    | One lead + every buyer it was pinged to  |
| GET    | `/api/zip-list`                     | Zip list (`?format=csv` to export)       |
| GET    | `/api/adjustments`                  | Adjustment history                       |
| POST   | `/api/adjustments`                  | Record a manual correction               |

Shared filters: `from`, `to` (YYYY-MM-DD), `vertical`, `campaign_id`,
`supplier_id`, `buyer_id`. Range defaults to the last 30 days.

## Notes

**Adjustments are scoped to a window.** An override applies only when
the query range fully contains its period — a lump-sum correction
cannot be sliced across a partial window. It is also applied to the
client's largest row only: a client supplying four campaigns appears as
four rows, and repeating the override on each would multiply it.

**`/api/accounting` figures are netted inside LeadProsper's own
window**, so they cannot be sliced to an arbitrary range. The response
carries `source_period` saying which window they actually cover.

**Ratios are computed per request**, never stored: summing a stored
`sell_rate` across days gives the wrong answer.

## Local

```bash
npm start     # :8081, expects a reachable ClickHouse
```

The UI runs separately under Vite in dev and proxies `/api` here.
