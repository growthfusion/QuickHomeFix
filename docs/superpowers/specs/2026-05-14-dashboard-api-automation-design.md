# Dashboard API Automation Design

## Goal

Replace all hardcoded `AD_SPEND` and `META_ADS` JavaScript arrays in `frontend/dash/form_leads.html` with live data fetched hourly from the Meta Ads API, Lead Prosper API, and RedTrack API — eliminating all daily manual JS file edits.

## Architecture

A `node-cron` scheduler runs every hour inside the existing Express process (`backend/server.js`). It triggers three isolated fetcher modules, each responsible for one API. Each fetcher writes its results into a dedicated ClickHouse table. Three new backend endpoints serve the latest snapshot to the frontend. The frontend replaces hardcoded arrays with `fetch()` calls on page load.

```
[Meta Ads API]      [Lead Prosper API]   [RedTrack API]
       |                    |                   |
       └────────────────────┴───────────────────┘
                            |
                  [Hourly Scheduler - node-cron]
                  (inside backend/server.js)
                            |
               ┌────────────┼────────────┐
               │            │            │
     fetchMeta.js  fetchLeadProsper.js  fetchRedTrack.js
               │            │            │
               └────────────┼────────────┘
                            │
                  [ClickHouse Tables]
                  meta_ad_stats
                  leadprosper_stats
                  redtrack_stats
                            │
               ┌────────────┼────────────┐
               │            │            │
     GET /api/stats/meta  /leadprosper  /redtrack
               │            │            │
               └────────────┼────────────┘
                            │
                  [frontend/dash/form_leads.html]
              AD_SPEND + META_ADS arrays → fetch() calls
```

## Data Mapping

| Dashboard Column | Source | API Field |
|---|---|---|
| CLICKS | Meta Ads API | `clicks` |
| CTR, % | Meta Ads API | `ctr` |
| COST, $ | Meta Ads API | `spend` |
| SOURCE | Meta Ads API | `publisher_platform` |
| PLACEMENT | Meta Ads API | `placement` |
| CAMPAIGN ID | Meta Ads API | `campaign_id`, `campaign_name` |
| TEASER ID | Meta Ads API | `adset_id`, `adset_name` |
| TITLE | Meta Ads API | `ad_id`, `ad_name` |
| DEVICE | Meta Ads API | `device_platform` breakdown |
| OS | Meta Ads API | `impression_device` breakdown |
| STATE | Meta Ads API | `region` breakdown (state-level, e.g. "California") |
| REGION | Meta Ads API | Derived from `region` — first word or abbreviation mapped to a broader US region (e.g. "West", "South") |
| LEADS | ClickHouse (existing) | `count(*)` from `QuickHomeFix_leads` |
| EMAILS | — | Always empty, never fetched |
| SOLD | Lead Prosper API | `leads_accepted` |
| TOTAL REVENUE, $ | Lead Prosper API | `total_sell` |
| AVG PER LEAD, $ | Calculated | `total_sell / leads_accepted` |
| AVG PER SOLD, $ | Calculated | `total_sell / leads_sold` |
| EPC, $ | RedTrack API | `epc` |
| CR, % | Calculated | `leads / clicks * 100` |
| LANDING | RedTrack API | `landing` |

## ClickHouse Schema

### `meta_ad_stats`
```sql
CREATE TABLE meta_ad_stats (
  fetched_at          DateTime,
  date                Date,
  campaign_id         String,
  campaign_name       String,
  adset_id            String,
  adset_name          String,
  ad_id               String,
  ad_name             String,
  publisher_platform  String,
  placement           String,
  device              String,
  os                  String,
  state               String,
  region              String,
  clicks              UInt32,
  impressions         UInt32,
  ctr                 Float32,
  spend               Float32
) ENGINE = MergeTree()
ORDER BY (date, campaign_id, adset_id, ad_id, placement, device, os, state);
```

### `leadprosper_stats`
```sql
CREATE TABLE leadprosper_stats (
  fetched_at      DateTime,
  date            Date,
  campaign_id     String,
  campaign_name   String,
  leads_total     UInt32,
  leads_accepted  UInt32,
  leads_failed    UInt32,
  leads_returned  UInt32,
  total_buy       Float32,
  total_sell      Float32,
  net_profit      Float32
) ENGINE = MergeTree()
ORDER BY (date, campaign_id);
```

### `redtrack_stats`
```sql
CREATE TABLE redtrack_stats (
  fetched_at    DateTime,
  date          Date,
  campaign_id   String,
  campaign_name String,
  landing       String,
  clicks        UInt32,
  conversions   UInt32,
  revenue       Float32,
  cost          Float32,
  epc           Float32,
  roi           Float32
) ENGINE = MergeTree()
ORDER BY (date, campaign_id, landing);
```

All endpoints query: `WHERE fetched_at = (SELECT max(fetched_at) FROM <table>)` to always return the latest hourly snapshot.

## Files Created / Modified

| Action | File | Purpose |
|---|---|---|
| Modify | `backend/server.js` | Add `node-cron` scheduler + 3 new GET endpoints |
| Create | `backend/jobs/fetchMeta.js` | Meta Ads API fetcher |
| Create | `backend/jobs/fetchLeadProsper.js` | Lead Prosper API fetcher |
| Create | `backend/jobs/fetchRedTrack.js` | RedTrack API fetcher |
| Modify | `backend/.env` | Add 4 new API credential env vars |
| Modify | `frontend/dash/form_leads.html` | Replace hardcoded arrays with fetch() calls |

## Environment Variables

Four new variables added to `backend/.env`:

```
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
LEADPROSPER_API_KEY=
REDTRACK_API_KEY=
```

## Backend Scheduler

Added to `backend/server.js`:

```js
import cron from 'node-cron';
import { fetchMeta } from './jobs/fetchMeta.js';
import { fetchLeadProsper } from './jobs/fetchLeadProsper.js';
import { fetchRedTrack } from './jobs/fetchRedTrack.js';

// Runs every hour at :00
cron.schedule('0 * * * *', async () => {
  console.log('[cron] Starting hourly API sync...');
  await Promise.allSettled([fetchMeta(), fetchLeadProsper(), fetchRedTrack()]);
  console.log('[cron] Hourly sync complete.');
});
```

`Promise.allSettled` ensures one failing API never blocks the others.

## Fetcher Modules

### `backend/jobs/fetchMeta.js`
- Auth: `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` from `.env`
- Endpoint: `GET /{ad-account-id}/insights`
- Params: `level=ad`, breakdowns = `publisher_platform,placement,device_platform,impression_device,region`, `date_preset=today`
- Writes rows to `meta_ad_stats`

### `backend/jobs/fetchLeadProsper.js`
- Auth: `Authorization: Bearer LEADPROSPER_API_KEY`
- Endpoints: `GET /public/stats` and `GET /public/accounting`
- Params: `start_date` / `end_date` = today
- Writes rows to `leadprosper_stats`

### `backend/jobs/fetchRedTrack.js`
- Auth: `REDTRACK_API_KEY` query param or header
- Endpoint: RedTrack report endpoint with `landing` breakdown only
- Params: date range = today
- Writes rows to `redtrack_stats`

## New Backend Endpoints

```
GET /api/stats/meta
  Query: SELECT * FROM meta_ad_stats WHERE fetched_at = (SELECT max(fetched_at) FROM meta_ad_stats)
  Returns: Array of ad-level rows with all dimension + metric fields

GET /api/stats/leadprosper
  Query: SELECT * FROM leadprosper_stats WHERE fetched_at = (SELECT max(fetched_at) FROM leadprosper_stats)
  Returns: Array of campaign-level rows

GET /api/stats/redtrack
  Query: SELECT * FROM redtrack_stats WHERE fetched_at = (SELECT max(fetched_at) FROM redtrack_stats)
  Returns: Array of campaign+landing rows
```

## Frontend Changes

In `frontend/dash/form_leads.html`, two sets of changes are required:

**1. Replace hardcoded arrays with fetch() calls:**
```js
async function loadStats() {
  const [meta, lp, rt] = await Promise.all([
    fetch('/api/stats/meta').then(r => r.json()),
    fetch('/api/stats/leadprosper').then(r => r.json()),
    fetch('/api/stats/redtrack').then(r => r.json()),
  ]);
  window.AD_SPEND = meta;   // replaces hardcoded AD_SPEND array
  window.META_ADS = meta;   // replaces hardcoded META_ADS array
  window.LP_STATS = lp;     // new — provides SOLD and REVENUE columns
  window.RT_STATS = rt;     // new — provides EPC and LANDING columns
  renderDashboard();
}
loadStats();
```

**2. Update rendering logic to consume new data sources:**
The existing aggregation code for SOLD, TOTAL REVENUE, EPC, and LANDING columns currently has no live data source. These must be updated to read from `window.LP_STATS` and `window.RT_STATS` respectively. The CLICKS, CTR, COST, SOURCE, PLACEMENT, CAMPAIGN ID, TEASER ID, TITLE, DEVICE, OS, STATE, and REGION columns already read from `window.AD_SPEND` / `window.META_ADS` — those variable names are preserved so existing aggregation code for those columns requires no changes.

## Error Handling

- Each fetcher catches its own errors and logs them; failures do not affect other fetchers (`Promise.allSettled`)
- If a fetch fails, the ClickHouse table is not written — the dashboard continues to serve the previous hourly snapshot
- Frontend fetch errors show a console warning; the dashboard renders with whatever data is available

## Testing

- Unit test each fetcher with a mocked HTTP response to verify correct ClickHouse row shape
- Integration test: trigger the cron manually, verify rows appear in ClickHouse with correct `fetched_at`
- Frontend test: load `form_leads.html` and verify `AD_SPEND` / `META_ADS` arrays are populated from endpoints, not hardcoded
