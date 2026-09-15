# One-time GCP setup for the ping-post dashboard

Everything else deploys from GitHub Actions. This is the part that has
to be done once by someone with Owner on `pristine-lodge-459019-p4`.

Three steps. Roughly ten minutes.

## 1. Create the LeadProsper API key secret

The only secret the project is missing — `CLICKHOUSE_PASSWORD` already
exists and is reused.

```bash
gcloud config set project pristine-lodge-459019-p4

gcloud secrets create LEADPROSPER_API_KEY --replication-policy=automatic

# The key is in ping-post/sync/.env on the dev machine, as
# LEADPROSPER_API_KEY=...
printf '%s' 'PASTE_THE_KEY_HERE' | \
  gcloud secrets versions add LEADPROSPER_API_KEY --data-file=-
```

## 2. Let Cloud Run read both secrets

The services run as the default compute service account.

```bash
PROJECT=pristine-lodge-459019-p4
NUM=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
SA="$NUM-compute@developer.gserviceaccount.com"

for S in LEADPROSPER_API_KEY CLICKHOUSE_PASSWORD; do
  gcloud secrets add-iam-policy-binding $S \
    --member="serviceAccount:$SA" \
    --role=roles/secretmanager.secretAccessor
done
```

## 3. Schedule the sync (after the first deploy)

The sync service must exist before this — deploy from GitHub first, then
run this once. Cloud Scheduler is the clock: it POSTs `/sync` every ten
minutes, and the container scales to zero in between.

```bash
PROJECT=pristine-lodge-459019-p4
REGION=us-central1
SERVICE=quickhomefix-pingpost-sync-test   # drop -test for production
NUM=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
SA="$NUM-compute@developer.gserviceaccount.com"

URL=$(gcloud run services describe $SERVICE --region $REGION \
        --format='value(status.url)')

gcloud run services add-iam-policy-binding $SERVICE \
  --region $REGION --member="serviceAccount:$SA" --role=roles/run.invoker

gcloud scheduler jobs create http pingpost-sync-test \
  --location $REGION \
  --schedule "*/10 * * * *" \
  --time-zone "America/New_York" \
  --uri "$URL/sync" \
  --http-method POST \
  --oidc-service-account-email $SA \
  --oidc-token-audience "$URL" \
  --attempt-deadline 1800s
```

Run it once by hand before trusting the schedule — the first run
backfills 180 days across every campaign and takes a while:

```bash
gcloud scheduler jobs run pingpost-sync-test --location $REGION
gcloud run services logs read $SERVICE --region $REGION --limit 50
```

## What is NOT needed

- No Cloud Run services to create by hand — GitHub Actions deploys them.
- No `CLICKHOUSE_PASSWORD` to create — it already exists.
- No Cloud Functions. The sync is already Cloud Run + Scheduler, which
  is the same pattern with a longer timeout (a 180-day backfill needs
  more than the 9 minutes Functions v1 allows).

## Access note

`adithya.r@growthfusion.co` currently holds `projectOwnerInvitee` — a
pending invitation, not working access. Accepting it at
console.cloud.google.com grants Owner; until then these steps need
`srinath.s@growthfusion.co`, who holds `roles/owner`.
