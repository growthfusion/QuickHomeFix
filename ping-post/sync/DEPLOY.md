# Deploying the sync service to Cloud Run

The service is an HTTP server. Cloud Scheduler is the clock — it POSTs
`/sync` on a schedule. The container does not schedule its own work: one
that did would have to stay warm to be correct, which fights Cloud Run's
scale-to-zero and pays for idle time.

## Endpoints

| Method | Path       | Purpose                                  |
| ------ | ---------- | ---------------------------------------- |
| GET    | `/`        | Liveness probe                           |
| POST   | `/sync`    | Run one sync (the Scheduler target)      |
| POST   | `/migrate` | Apply migrations (manual, one-off)       |

`POST /sync?backfillDays=365` overrides the backfill window for a
campaign with no checkpoint yet.

Concurrent runs are refused with **409**, not queued. Scheduler retries
on non-2xx, and a retry landing mid-run would double the API calls
against LeadProsper's 100/min ceiling. The data would survive — inserts
are idempotent — but the rate limit would not.

## 1. Set variables

```bash
PROJECT=your-gcp-project
REGION=us-central1
SERVICE=hsp-sync

gcloud config set project $PROJECT
```

## 2. Store secrets in Secret Manager

Never pass these as plain `--set-env-vars`: that puts them in the
service description, visible to anyone with Viewer on the project.

```bash
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com \
  secretmanager.googleapis.com cloudbuild.googleapis.com

printf '%s' 'YOUR_LP_API_KEY'   | gcloud secrets create leadprosper-api-key --data-file=-
printf '%s' 'YOUR_CH_PASSWORD'  | gcloud secrets create clickhouse-password --data-file=-
```

## 3. Service account

```bash
gcloud iam service-accounts create hsp-sync --display-name="Ping Post Sync"

SA="hsp-sync@$PROJECT.iam.gserviceaccount.com"

gcloud secrets add-iam-policy-binding leadprosper-api-key \
  --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding clickhouse-password \
  --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor
```

## 4. Deploy

Build context is the `ping-post/` root, not `sync/` — the service ships
the migrations, which live outside this folder.

```bash
cd ping-post

gcloud run deploy $SERVICE \
  --source . \
  --region $REGION \
  --service-account $SA \
  --no-allow-unauthenticated \
  --timeout 3600 \
  --memory 1Gi \
  --max-instances 1 \
  --set-env-vars "LEADPROSPER_MODE=live,LP_TIMEZONE=America/New_York,CLICKHOUSE_URL=https://YOUR_HOST:8443,CLICKHOUSE_DB=ping_post,CLICKHOUSE_USER=default,BACKFILL_DAYS=180" \
  --set-secrets "LEADPROSPER_API_KEY=leadprosper-api-key:latest,CLICKHOUSE_PASSWORD=clickhouse-password:latest"
```

Why these flags:

- `--no-allow-unauthenticated` — only the Scheduler's service account
  may invoke it. A public sync endpoint is a free way for anyone to burn
  your LeadProsper rate limit.
- `--timeout 3600` — a first-run 180-day backfill across many campaigns
  runs long. The default 300s would kill it partway.
- `--max-instances 1` — the rate limiter in `httpClient.js` paces calls
  within a single process. Two instances would double the real rate and
  trip LeadProsper's 100/min ceiling.

## 5. Let Scheduler invoke it

```bash
gcloud run services add-iam-policy-binding $SERVICE \
  --region $REGION \
  --member="serviceAccount:$SA" \
  --role=roles/run.invoker
```

## 6. Create the schedule

```bash
URL=$(gcloud run services describe $SERVICE --region $REGION --format='value(status.url)')

gcloud scheduler jobs create http hsp-sync-job \
  --location $REGION \
  --schedule "*/10 * * * *" \
  --time-zone "America/New_York" \
  --uri "$URL/sync" \
  --http-method POST \
  --oidc-service-account-email $SA \
  --oidc-token-audience "$URL" \
  --attempt-deadline 1800s
```

## 7. First run

Apply the schema, then trigger one sync by hand before trusting the
schedule:

```bash
TOKEN=$(gcloud auth print-identity-token)

curl -X POST -H "Authorization: Bearer $TOKEN" "$URL/migrate"
curl -X POST -H "Authorization: Bearer $TOKEN" "$URL/sync"
```

Or force the schedule early:

```bash
gcloud scheduler jobs run hsp-sync-job --location $REGION
```

## 8. Map campaigns to verticals

LeadProsper has no vertical field, so `hs_campaign_vertical` is ours to
maintain. Until a campaign is mapped, its leads carry an empty vertical
and every vertical-sliced report under-reports. The sync logs a WARNING
naming how many are unmapped.

```sql
INSERT INTO ping_post.hs_campaign_vertical (campaign_id, vertical) VALUES
  (33962, 'Roofing'),
  (33963, 'Bathroom');
```

Find unmapped campaigns:

```sql
SELECT campaign_id, name
FROM ping_post.lp_campaigns FINAL
WHERE campaign_id NOT IN (SELECT campaign_id FROM ping_post.hs_campaign_vertical)
```

Verticals are stamped at sync time, so a newly-mapped campaign applies
to leads synced afterwards. To fix history, re-sync that campaign's
window — safe, because the inserts are idempotent.

## Logs

```bash
gcloud run services logs read $SERVICE --region $REGION --limit 50
```

## Local

```bash
npm start                                  # server on :8080
curl -X POST localhost:8080/sync

npm run sync                               # one run, no HTTP
node src/runOnce.js --backfill-days=365     # manual backfill
```
