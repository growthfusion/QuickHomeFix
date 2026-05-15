# Meta Removal & RT+LP Redesign — Design Spec

**Date:** 2026-05-15
**Branch:** hi/qhf
**Goal:** Remove the Meta Ads API integration completely. RedTrack replaces every traffic metric Meta used to provide. LeadProsper provides leads, sold, revenue, profit. The two sources are joined by campaign name — no mapping table, no keyword guessing.

---

## 1. What Is Being Removed

Everything Meta-related is deleted with no fallbacks or legacy references.

### Files deleted
- `backend/jobs/fetchMeta.js`

### ClickHouse tables dropped (via migration)
- `meta_ad_stats`
- `campaign_mapping`

### Environment variables removed from `.env`
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`

### Removed from `server.js`
- `import { fetchMeta }` statement
- `fetchMeta()` call in startup job runner
- `fetchMeta()` call in cron job (`0 * * * *`)
- `GET /api/stats/meta` endpoint
- `GET /api/campaign-mapping` endpoint
- `POST /api/campaign-mapping` endpoint
- `DELETE /api/campaign-mapping/:id` endpoint
- All references to `meta_ad_stats` table
- All references to `campaign_mapping` table

### Removed from `frontend/dash/form_leads.html`
- `fetch('/api/stats/meta')` call
- `fetch('/api/campaign-mapping')` call
- `AD_SPEND` array and all code that builds or reads it
- `META_ADS` array and all code that builds or reads it
- `META_DEVICE` array and all code that builds or reads it
- `META_REGION` array and all code that builds or reads it
- `CAMPAIGN_MAP` object and all join logic that uses it
- `inferForm()` function (keyword-based campaign name matching)
- All columns or computations that sourced data from `meta_ad_stats`

No fallback references to Meta anywhere in the codebase after this change.

---

## 2. ClickHouse Schema

### `leadprosper_stats` — unchanged
### `QuickHomeFix_leads` — unchanged

### `redtrack_stats` — dropped and recreated

The old `redtrack_stats` table is explicitly dropped before recreating because the column set changes. Without the DROP the old schema stays and the new columns do not apply.

```sql
CREATE TABLE redtrack_stats (
  fetched_at      DateTime64(3, 'UTC') DEFAULT now64(3),
  date            Date,
  breakdown_type  String,
  group_key       String,
  campaign_name   String,
  channel         String,
  lander_name     String,
  lp_views        UInt32,
  lp_clicks       UInt32,
  lp_ctr          Float64,
  conversions     UInt32,
  purchases       UInt32,
  revenue         Float64,
  cost            Float64,
  roi             Float64,
  device          String,
  os              String,
  region          String
) ENGINE = MergeTree()
ORDER BY (date, breakdown_type, group_key, campaign_name);
```

**`breakdown_type` values:**

| Value | Meaning | `group_key` |
|---|---|---|
| `'daily'` | date-only totals | `''` |
| `'campaign'` | per campaign name | campaign name |
| `'os'` | per OS | OS name |
| `'device'` | per device type | device name |
| `'region'` | per country/region | region name |
| `'lander'` | per lander/offer | lander name |

**Core RT metrics (the only click/view metrics in the system):**
- `lp_views` — landing page views (visits)
- `lp_clicks` — landing page clicks (`row.lp_clicks || row.landing_clicks || 0`)
- `lp_ctr` — computed: `lp_views > 0 ? (lp_clicks / lp_views) * 100 : 0`

Columns `clicks` (ad clicks), `epc`, and `ctr` from the old schema do not exist. There are no Meta ad click metrics anywhere.

The `device` column is set only for `breakdown_type='device'` rows. `os` only for `'os'` rows. `region` only for `'region'` rows. Other rows leave these as `''`.

---

## 3. `fetchRedTrack.js` Rewrite

Complete rewrite. All 7 calls are sequential with `RT_CALL_DELAY_MS` between each to avoid HTTP 429.

### Call sequence

| # | Endpoint | Groups | `breakdown_type` | `group_key` source |
|---|---|---|---|---|
| 1 | `GET /traffic_sources?api_key=…&limit=200` | — | builds `sourceMap` only | — |
| 2 | `GET /report` | `date` | `'daily'` | `''` |
| 3 | `GET /report` | `date`, `os` | `'os'` | `row.os \|\| row.os_family \|\| ''` |
| 4 | `GET /report` | `date`, `device` | `'device'` | `row.device \|\| row.device_type \|\| ''` |
| 5 | `GET /report` | `date`, `country` | `'region'` | `row.country \|\| row.country_name \|\| row.region \|\| ''` |
| 6 | `GET /report` | `date`, `campaign` | `'campaign'` | `row.campaign \|\| row.campaign_name \|\| row.name \|\| row.title \|\| ''` |
| 7 | `GET /report` | `date`, `offer` | `'lander'` | `row.offer \|\| row.offer_name \|\| row.lander \|\| ''` |

Delay after calls 1–6. No delay after call 7 (last call).

### `sourceMap` structure

```js
sourceMap[source_id] = {
  channel_name: row.name || row.title || '',
  lander_name:  row.lander?.name || row.offer?.name || row.landing?.name || '',
}
```

Every report row looks up its source ID in `sourceMap` to fill `channel` and `lander_name`. If no match, both are `''`. The row is still stored — missing source ID is not a reason to drop a row.

### Row mapping

```js
{
  fetched_at:     currentTimestamp,
  date:           row.date,
  breakdown_type: type,
  group_key:      derivedGroupKey,   // see table above; 'unknown' if RT returns empty key
  campaign_name:  row.campaign || row.campaign_name || row.name || row.title || '',
  channel:        sourceMap[row.source_id]?.channel_name || '',
  lander_name:    sourceMap[row.source_id]?.lander_name  || '',
  lp_views:       Number(row.lp_views)  || 0,
  lp_clicks:      Number(row.lp_clicks) || Number(row.landing_clicks) || 0,
  lp_ctr:         lp_views > 0 ? (lp_clicks / lp_views) * 100 : 0,
  conversions:    Number(row.conversions) || 0,
  purchases:      Number(row.purchases)   || 0,
  revenue:        Number(row.revenue)     || 0,
  cost:           Number(row.cost)        || 0,
  roi:            Number(row.roi)         || 0,
  device:         type === 'device' ? groupKey : '',
  os:             type === 'os'     ? groupKey : '',
  region:         type === 'region' ? groupKey : '',
}
```

### Empty group_key handling

If a breakdown call returns rows where the derived `group_key` would be `''`, log a warning and store as `'unknown'` rather than filtering:

```
[fetchRedTrack] {breakdown} grouping returned empty keys - RT may not support this breakdown
```

Rows without a `date` field are filtered out and not inserted.

### Insert

All rows from all 7 calls accumulated into `allRows`. A single `ch.insert({ table: 'redtrack_stats', values: allRows, format: 'JSONEachRow' })` at the end.

If `allRows.length === 0`, log `[fetchRedTrack] No data returned` and return without inserting.

Each individual call is wrapped in try/catch. Failure logs `console.warn` and contributes `[]` rows. The job never throws — all available data is still inserted.

---

## 4. `server.js` Endpoint Changes

### Removed
- `import { fetchMeta } from './jobs/fetchMeta.js'`
- `fetchMeta()` in startup + cron
- `GET /api/stats/meta`
- `GET /api/campaign-mapping`
- `POST /api/campaign-mapping`
- `DELETE /api/campaign-mapping/:id`

### Updated — `GET /api/stats/redtrack`

Queries `redtrack_stats` for the latest `fetched_at`, returns all rows structured by `breakdown_type`. All 18 fields returned per row — no projection or field stripping.

```js
// Query
SELECT * FROM redtrack_stats
WHERE fetched_at = (SELECT max(fetched_at) FROM redtrack_stats)

// Response shape
{
  daily:    [...],  // breakdown_type = 'daily'
  campaign: [...],  // breakdown_type = 'campaign'
  os:       [...],  // breakdown_type = 'os'
  device:   [...],  // breakdown_type = 'device'
  region:   [...],  // breakdown_type = 'region'
  lander:   [...]   // breakdown_type = 'lander'
}
```

### Updated — `POST /api/dev/migrate`

Exact execution order:

1. `DROP TABLE IF EXISTS meta_ad_stats`
2. `DROP TABLE IF EXISTS campaign_mapping`
3. `DROP TABLE IF EXISTS redtrack_stats`
4. `CREATE TABLE redtrack_stats (…new schema…)`
5. `CREATE TABLE IF NOT EXISTS leadprosper_stats`
6. Ensure `QuickHomeFix_leads` exists

Steps 3 and 4 together force the schema update. Steps 1 and 2 remove orphaned tables.

### Unchanged
`POST /api/leads`, `GET /api/stats/leadprosper`, `GET /api/stats/lp-form-map`, `GET /api/stats/leads-breakdown`, `GET /api/leads/count`, `GET /api/leads/latest`, `GET /api/places/autocomplete`, `POST /api/dev/force-fetch`. All security middleware unchanged.

---

## 5. Dashboard (`form_leads.html`)

### Data fetching

```js
const [rtRes, lpRes, ldRes, lpFormMapRes] = await Promise.all([
  fetch('/api/stats/redtrack').then(r => r.json()),
  fetch('/api/stats/leadprosper').then(r => r.json()),
  fetch('/api/stats/leads-breakdown').then(r => r.json()).catch(() => ({ state: [], device: [], os: [], campaign: [] })),
  fetch('/api/stats/lp-form-map').then(r => r.json()).catch(() => []),
])
```

### In-memory variables

```
RT_DAILY    ← rtRes.daily
RT_CAMPAIGN ← rtRes.campaign
RT_OS       ← rtRes.os
RT_DEVICE   ← rtRes.device
RT_REGION   ← rtRes.region
RT_LANDER   ← rtRes.lander
LP_ROWS     ← processed lpRes campaign rows
LD_STATE    ← ldRes.state
LD_DEVICE   ← ldRes.device
LD_OS       ← ldRes.os
LD_CAMPAIGN ← ldRes.campaign
LP_FORM_MAP ← keyed by lp_campaign_id
```

### Table view sources

**DATE table** — one row per date
- `lp_views`, `lp_clicks`, `lp_ctr` from `RT_DAILY`
- `cost` from `RT_DAILY`
- `leads`, `sold`, `revenue` summed from `LP_ROWS` by date

**CAMPAIGN table** — one row per campaign name
- Join `RT_CAMPAIGN` ↔ `LP_ROWS` on exact `campaign_name`
- RT-only rows: visits/clicks/cost from RT, leads/revenue = 0
- LP-only rows: leads/revenue from LP, visits/clicks/cost = 0
- All mismatches logged: `console.warn('[dashboard] RT campaign not found in LP:', name)` and vice versa

**FORM table** — one row per form type (bath/roof/windo/other)
- Form type derived from `LP_FORM_MAP` (uses `normalized_service` from `QuickHomeFix_leads`)
- Visits/clicks proportional from `RT_DAILY`:
  ```
  form_visits    = Σ(RT_DAILY.lp_views)  × (form_leads / total_leads)
  form_lp_clicks = Σ(RT_DAILY.lp_clicks) × (form_leads / total_leads)
  form_lp_ctr    = form_lp_clicks > 0 ? (form_lp_clicks / form_visits) × 100 : 0
  ```
  All zero when `total_leads = 0`
- `leads`, `sold`, `revenue` summed from `LP_ROWS` grouped by form type

**LANDING table** — one row per lander
- `lp_views`, `lp_clicks`, `lp_ctr`, `cost` from `RT_LANDER`
- LP data matched by lander name if available; otherwise 0

**STATE table** — one row per US state
- `leads`, `sold`, `revenue` from `LD_STATE`
- Visits/cost proportional: `RT_DAILY total × (state_leads / total_leads)`

**DEVICE table** — one row per device type
- `lp_views`, `lp_clicks` from `RT_DEVICE`
- `leads`, `sold`, `revenue` from `LD_DEVICE`
- Join on normalized device name (both sides normalized before matching)

**OS table** — one row per OS
- `lp_views`, `lp_clicks` from `RT_OS`
- `leads`, `sold`, `revenue` from `LD_OS`
- Join on normalized OS name

**REGION table** — one row per region
- `lp_views`, `lp_clicks`, `lp_ctr`, `cost` from `RT_REGION`
- Lead/revenue data not available at region level

### Name normalization (required before joins)

**Device** — normalize both RT and LD sides to same strings:
```
RT row.device || row.device_type:
  contains 'mobile' or 'android' → 'mobile'
  contains 'tablet'              → 'tablet'
  anything else                  → 'desktop'

LD side already returns 'mobile' / 'desktop' / 'tablet'
```

**OS** — normalize both RT and LD sides to same strings:
```
RT value (case-insensitive substring):
  'ios' or 'iphone' or 'ipad' → 'ios'
  'android'                   → 'android'
  'windows'                   → 'windows'
  'mac'                       → 'macos'
  anything else               → 'other'

LD side already returns ios/android/windows/macos/other
```

### Dashboard metric columns

| Column | Source |
|---|---|
| VISITS | `lp_views` |
| LP CLICKS | `lp_clicks` |
| LP CTR % | `lp_ctr` |
| LEADS | `LP_ROWS.leads_total` or `LD_*.leads` |
| SOLD | `LP_ROWS.leads_accepted` or `LD_*.sold` |
| ACC % | `sold / leads × 100` |
| REVENUE | `LP_ROWS.total_sell` or `LD_*.revenue` |
| COST | `RT_*.cost` |
| PROFIT | `revenue - cost` |
| AVG/LEAD | `revenue / leads` |
| AVG/SOLD | `revenue / sold` |
| EPV | `revenue / lp_views` |
| ROI % | `roi` from RT, or `(profit / cost) × 100` |

No EPC, no Meta CTR, no ad-click-based metrics anywhere.

---

## 6. Tests (`fetchRedTrack.test.js`)

Complete rewrite — all old tests removed. New suite:

**Call count and structure**
- Makes exactly 7 API calls (traffic_sources + 6 report calls)
- Campaign breakdown call present (`group[]=campaign` in URL)
- `date_from` / `date_to` in report URLs; old `from=` / `to=` absent

**Breakdown type correctness**
- `breakdown_type='daily'` rows: correct date, lp_views, lp_clicks, lp_ctr, `group_key=''`
- `breakdown_type='os'` rows: group_key from `row.os`
- `breakdown_type='device'` rows: group_key from `row.device`
- `breakdown_type='region'` rows (not `'country'`): group_key from `row.country`
- `breakdown_type='campaign'` rows: group_key from `row.campaign || row.campaign_name || row.name || row.title`
- `breakdown_type='lander'` rows (not `'offer'`): group_key from `row.offer || row.offer_name || row.lander`

**Field mapping**
- `lp_ctr` computed correctly: `lp_clicks/lp_views×100`, `0` when `lp_views=0`
- `'lp_clicks falls back to landing_clicks when lp_clicks is absent'`
- `'purchases mapped correctly from RT row'` — `row.purchases || 0`
- `'roi mapped correctly from RT row'` — `row.roi || 0`
- `'revenue mapped correctly from RT row'` — `row.revenue || 0`

**sourceMap**
- `channel` and `lander_name` filled from `sourceMap` lookup by source ID
- `'channel and lander_name are empty string when source ID not found in sourceMap'` — row still stored, not filtered

**Edge cases**
- All 6 breakdown types combined in single `ch.insert()` call
- Skips insert when all calls return empty
- Empty `group_key` rows stored as `'unknown'`, not filtered
- Rows without `date` field filtered out
- One call failing does not block others — remaining rows still inserted
- ClickHouse client closed exactly once even when all calls fail

No tests reference `'country'`, `'offer'`, `clicks` (ad clicks), or `epc`.

---

## 7. Deployment & Migration

### Pre-deploy: verify RT API is alive

Before touching any code, manually verify:
```
GET https://api.redtrack.io/report
  ?api_key={REDTRACK_API_KEY}
  &date_from=YYYY-MM-DD
  &date_to=YYYY-MM-DD
  &group[]=date
```

- Returns data → proceed
- Returns empty or 401 → **stop**. Fix `REDTRACK_API_KEY` first. Do not deploy until RT API is confirmed working.

**Reason:** after migration `meta_ad_stats` is gone. If RT API is broken at deploy time, the dashboard has zero data until RT is fixed.

### Deploy sequence

**Step 1** — Deploy code (new `fetchRedTrack.js`, updated `server.js`, updated `form_leads.html`, `fetchMeta.js` deleted)

**Step 2** — Run `POST /api/dev/migrate` once. Executes in order:
1. `DROP TABLE IF EXISTS meta_ad_stats`
2. `DROP TABLE IF EXISTS campaign_mapping`
3. `DROP TABLE IF EXISTS redtrack_stats`
4. `CREATE TABLE redtrack_stats` (new schema)
5. `CREATE TABLE IF NOT EXISTS leadprosper_stats`
6. Ensure `QuickHomeFix_leads` exists

**Step 3** — Run `POST /api/dev/force-fetch` to populate both `redtrack_stats` and `leadprosper_stats` immediately.

**Step 3.5 — Verify data before removing env vars:**

Check 1 — `GET /api/stats/redtrack`:
- `daily` must be non-empty → **hard stop if empty**, run force-fetch again and investigate
- Other keys (`campaign`, `os`, `device`, `region`, `lander`) empty → log warning only, RT may not support those breakdowns

Check 2 — `GET /api/stats/leadprosper`:
- Must have at least one row → if empty, run force-fetch again and wait

**Step 4** — Only after both checks pass: remove `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` from `.env`, restart server.

### Out of scope (not touched)
- `/get-quotes/` HTML files
- Tracking JS files (`tracking.js`, `store.js`, etc.)
- `fetchLeadProsper.js`
- `/api/leads` endpoint logic
- Zod validation, helmet, rate-limiter, Cache-Control middleware

---

## Constraints (carried from spec)

1. All new endpoints validated with Zod. `400 { error: 'validation failed', details: zodError.issues }` on schema failure.
2. All RT API calls sequential with `RT_CALL_DELAY_MS` between each. Never parallel.
3. Every ClickHouse query returns `[]` on no rows. No endpoint throws on empty result.
4. Log all RT↔LP campaign name mismatches. Show mismatched rows with zeros — never discard them.
5. Device and OS names normalized on both RT and LD sides before joining.
6. No new environment variables.
