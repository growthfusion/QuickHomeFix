# Data Quality Fixes — Design Spec

**Goal:** Replace keyword-guessing and proportional-estimate logic in the QuickHomeFix dashboard with real data already stored in the `leads` ClickHouse table, and add campaign-level cross-source mapping via a new `campaign_mapping` table.

**Architecture:** Three sequential fixes, each independently deployable. All changes are confined to `server.js` (new endpoints) and `frontend/dash/form_leads.html` (dashboard JS). Zero changes to `/get-quotes/` pages, tracking JS files, cron jobs, or existing ClickHouse tables.

**Tech Stack:** Node.js ES modules, Express 5, ClickHouse Cloud (`@clickhouse/client`), static HTML dashboard.

---

## Constraints

- **DO NOT MODIFY:** `frontend/get-quotes/*.html`, any tracking/beacon/pixel JS, `jobs/fetch*.js`, existing `/api/leads` logic, existing security middleware (helmet, rate-limit, Zod on leads, Cache-Control).
- **DO NOT ADD** new environment variables.
- **DO NOT CHANGE** rate limiter settings (60 req/min/IP covers all new endpoints).
- Only `Nullable` columns may be added to existing tables — no schema breaks.
- All new ClickHouse queries against `ReplacingMergeTree` tables must use `FINAL`.
- All new endpoints validated with Zod. Return `HTTP 400 { error: 'validation failed', details: zodError.issues }` on schema failure.
- All new multi-query endpoints run queries via `Promise.all`. Individual failures return `[]` for that key; the endpoint never fails wholesale.

---

## Fix A — URL-based form type inference

**Problem:** `inferForm(campaign_name)` uses keyword matching on campaign names to bucket LP rows into form types (`bath`, `roof`, `windo`, `other`). Campaigns named without service keywords (e.g. `HomeImprovement-Q2-V3`) silently fall into `'other'` and their revenue is lost.

**Solution:** The `leads` table already stores `normalized_service` (e.g. `BATH_REMODEL`, `ROOFING_ASPHALT`, `WINDOWS`) and `landing_page_url` on every lead. Query the `leads` table grouped by `lp_campaign_id` to derive the authoritative form type for each LP campaign — no guessing required.

### New endpoint: `GET /api/stats/lp-form-map`

Query:
```sql
SELECT
  lp_campaign_id,
  any(normalized_service) AS sample_service,
  any(landing_page_url)   AS sample_url
FROM leads
WHERE created_at >= now() - INTERVAL 90 DAY
  AND lp_campaign_id IS NOT NULL
  AND lp_campaign_id != ''
GROUP BY lp_campaign_id
```

For each row, derive `form_type` with this priority:

1. Parse `normalized_service`:
   - contains `BATH`, `TUB`, or `SHOWER` → `'bath'`
   - contains `ROOF` → `'roof'`
   - contains `WINDOW` → `'windo'`
2. If null or unrecognised, parse `sample_url` path:
   - `/get-quotes/bath`, `/bath`, `/shower` → `'bath'`
   - `/get-quotes/roof`, `/roof` → `'roof'`
   - `/get-quotes/window`, `/window` → `'windo'`
3. Both null → `'other'`

Response: `Array<{ lp_campaign_id: string, form_type: string }>`

No Zod needed (GET with no body). Handle empty results as `[]`.

### Dashboard change (`form_leads.html`)

- Add `/api/stats/lp-form-map` to the parallel `fetch()` calls on load.
- Store as `LP_FORM_MAP` object keyed by `lp_campaign_id` for O(1) lookup.
- In the LP_ROWS builder: look up `LP_FORM_MAP[r.campaign_id]` first. Fall back to `inferForm(r.campaign_name)` only when no entry exists.

---

## Fix B — `campaign_mapping` table

**Problem:** The Campaign ID table view in the dashboard has no way to join a Meta `campaign_id` to an LP `campaign_id` — there is no shared key between the two systems. LP revenue cannot be attributed to a specific Meta campaign.

**Solution:** A manually maintained `campaign_mapping` ClickHouse table that the developer populates once per campaign (or updates when campaigns change). The dashboard uses it only for the Campaign ID table view.

### New ClickHouse table

```sql
CREATE TABLE campaign_mapping (
  meta_campaign_id  String,
  lp_campaign_id    String,
  rt_source_id      String,
  form_type         String,
  label             Nullable(String),
  created_at        DateTime64(3, 'UTC') DEFAULT now64(3)
) ENGINE = ReplacingMergeTree(created_at)
ORDER BY (meta_campaign_id);
```

`ReplacingMergeTree(created_at)`: re-inserting a row for the same `meta_campaign_id` replaces the old row (newer `created_at` wins). Always query with `FINAL` to force deduplication before background merge completes.

Add the `CREATE TABLE IF NOT EXISTS` statement to the existing `POST /api/dev/migrate` endpoint so it runs with a single migration call.

### New endpoints

**`GET /api/campaign-mapping`**
```sql
SELECT * FROM campaign_mapping FINAL
ORDER BY form_type, meta_campaign_id
```
Returns JSON array. No request body.

**`POST /api/campaign-mapping`**

Zod schema:
```
meta_campaign_id  String, min length 1
lp_campaign_id    String, min length 1
rt_source_id      String, default ''
form_type         String, enum ['bath','roof','windo','other']
label             String, optional
```
Inserts one row. Returns `{ ok: true }`.

**`DELETE /api/campaign-mapping/:meta_campaign_id`**
```sql
ALTER TABLE campaign_mapping DELETE
WHERE meta_campaign_id = {param}
```
Returns `{ ok: true }`. The `meta_campaign_id` param must be validated as non-empty before the query runs.

### Dashboard change (`form_leads.html`)

- Add `/api/campaign-mapping` to the parallel fetch on load.
- Store as `CAMPAIGN_MAP` object keyed by `meta_campaign_id`.
- Use `CAMPAIGN_MAP` **only** in the Campaign ID table view: when building a Meta campaign row, look up the LP campaign ID, then cross-reference LP revenue and RT visits for that campaign.
- Do not use `CAMPAIGN_MAP` to replace `LP_FORM_MAP` — they solve different problems.

### Population

Do not seed this table with code. After deployment, the developer inserts one row per campaign via `POST /api/campaign-mapping`. No ongoing maintenance unless new campaigns are added.

---

## Fix C — Real state, device, OS counts from `leads`

**Problem:** State, device, and OS breakdowns in the dashboard are fabricated:
```
rowVisits = totalRtVisits × (rowSpend / totalSpend)
```
This has no relationship to actual traffic distribution. A low-spend state can have high organic traffic; the estimate will never reflect this.

**Solution:** The `leads` table already contains `state` (2-letter US state code from homeowner address), `user_agent` (full browser UA from the form submission request), and `normalized_service` (the authoritative service type). Query these directly — no new tables, no frontend beacon changes.

The dashboard's State/Device/OS views switch from **fabricated visit estimates** to **real lead counts + revenue**. The VISITS column `[1]` continues using RT `lp_views` (unchanged) — only LEADS, SOLD, and REVENUE become real.

### New endpoint: `GET /api/stats/leads-breakdown`

Runs four queries in parallel via `Promise.all`. Any individual failure returns `[]` for that key; the rest succeed normally.

**Query 1 — by state:**
```sql
SELECT
  state,
  multiIf(
    normalized_service LIKE '%BATH%' OR
    normalized_service LIKE '%TUB%' OR
    normalized_service LIKE '%SHOWER%', 'bath',
    normalized_service LIKE '%ROOF%',   'roof',
    normalized_service LIKE '%WINDOW%', 'windo',
    'other'
  ) AS form_type,
  toDate(created_at) AS date,
  count()                AS leads,
  sum(partner_delivered) AS sold,
  sum(partner_payout)    AS revenue
FROM leads
WHERE created_at >= now() - INTERVAL 30 DAY
  AND state IS NOT NULL
  AND state != ''
GROUP BY state, form_type, date
ORDER BY date DESC, leads DESC
```

**Query 2 — by device:**
```sql
SELECT
  multiIf(
    user_agent LIKE '%Mobile%' OR
    user_agent LIKE '%Android%', 'mobile',
    'desktop'
  ) AS device,
  multiIf(
    normalized_service LIKE '%BATH%' OR
    normalized_service LIKE '%TUB%' OR
    normalized_service LIKE '%SHOWER%', 'bath',
    normalized_service LIKE '%ROOF%',   'roof',
    normalized_service LIKE '%WINDOW%', 'windo',
    'other'
  ) AS form_type,
  toDate(created_at) AS date,
  count()                AS leads,
  sum(partner_delivered) AS sold,
  sum(partner_payout)    AS revenue
FROM leads
WHERE created_at >= now() - INTERVAL 30 DAY
  AND user_agent IS NOT NULL
  AND user_agent != ''
GROUP BY device, form_type, date
ORDER BY date DESC, leads DESC
```

**Query 3 — by OS:**
```sql
SELECT
  multiIf(
    user_agent LIKE '%iPhone%' OR
    user_agent LIKE '%iPad%' OR
    user_agent LIKE '%iPod%',    'ios',
    user_agent LIKE '%Android%', 'android',
    user_agent LIKE '%Windows%', 'windows',
    user_agent LIKE '%Macintosh%', 'macos',
    'other'
  ) AS os,
  multiIf(
    normalized_service LIKE '%BATH%' OR
    normalized_service LIKE '%TUB%' OR
    normalized_service LIKE '%SHOWER%', 'bath',
    normalized_service LIKE '%ROOF%',   'roof',
    normalized_service LIKE '%WINDOW%', 'windo',
    'other'
  ) AS form_type,
  toDate(created_at) AS date,
  count()                AS leads,
  sum(partner_delivered) AS sold,
  sum(partner_payout)    AS revenue
FROM leads
WHERE created_at >= now() - INTERVAL 30 DAY
  AND user_agent IS NOT NULL
  AND user_agent != ''
GROUP BY os, form_type, date
ORDER BY date DESC, leads DESC
```

**Query 4 — daily totals:**
```sql
SELECT
  toDate(created_at) AS date,
  multiIf(
    normalized_service LIKE '%BATH%' OR
    normalized_service LIKE '%TUB%' OR
    normalized_service LIKE '%SHOWER%', 'bath',
    normalized_service LIKE '%ROOF%',   'roof',
    normalized_service LIKE '%WINDOW%', 'windo',
    'other'
  ) AS form_type,
  count()                AS leads,
  sum(partner_delivered) AS sold,
  sum(partner_payout)    AS revenue
FROM leads
WHERE created_at >= now() - INTERVAL 30 DAY
GROUP BY date, form_type
ORDER BY date DESC
```

Response:
```json
{ "state": [...], "device": [...], "os": [...], "daily": [...] }
```

### Dashboard change (`form_leads.html`)

- Add `/api/stats/leads-breakdown` to the parallel `fetch()` calls on load.
- Store as `LD_STATE`, `LD_DEVICE`, `LD_OS`, `LD_DAILY`.

**State table view:** Replace proportional estimate logic. Filter `LD_STATE` by active date range and form filter, group by `state`, sum `leads`, `sold`, `revenue`. Map to `lpRow(state, leads, sold, accPct, revenue, ad, visits)` where `visits` continues to use the RT proportional estimate (VISITS column does not change).

**Device table view:** Same pattern using `LD_DEVICE`, keyed by `device`.

**OS table view:** Same pattern using `LD_OS`, keyed by `os`.

**Fallback rule:** If `LD_STATE` / `LD_DEVICE` / `LD_OS` are empty (no leads in date range), render empty rows — do not fall back to proportional estimates. Empty and honest is better than populated and wrong.

**VISITS column `[1]` does not change** across any table view. RT `lp_views` remains the visit source throughout.

---

## Files changed

| File | Changes |
|---|---|
| `server.js` | + `GET /api/stats/lp-form-map` (Fix A) |
| | + `GET /api/campaign-mapping` (Fix B) |
| | + `POST /api/campaign-mapping` (Fix B) |
| | + `DELETE /api/campaign-mapping/:id` (Fix B) |
| | + campaign_mapping table in `POST /api/dev/migrate` (Fix B) |
| | + `GET /api/stats/leads-breakdown` (Fix C) |
| `frontend/dash/form_leads.html` | + Load `LP_FORM_MAP`, update LP_ROWS form_type (Fix A) |
| | + Load `CAMPAIGN_MAP`, use in Campaign ID view (Fix B) |
| | + Load `LD_STATE/DEVICE/OS/DAILY`, replace estimates (Fix C) |

## Files not touched

`frontend/get-quotes/*.html`, `frontend/js/tracking.js`, `jobs/fetch*.js`, all existing endpoints, all security middleware.
