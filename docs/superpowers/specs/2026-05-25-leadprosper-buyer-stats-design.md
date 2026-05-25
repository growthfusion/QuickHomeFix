# LeadProsper Buyer Stats — Design Spec

**Date:** 2026-05-25

## Problem

The LeadProsper `/public/stats` API already returns a `buyers` array per campaign per day (Modernize, Remodelwell, OpenHome, Leadvision, etc.), but `fetchLeadProsper.js` discards it. No buyer-level data is stored in ClickHouse.

## Goal

Capture buyer-level LP data into a new `leadprosper_buyer_stats` ClickHouse table so it can be queried independently without touching the existing `leadprosper_stats` table or dashboard.

## Buyer fields available from LP API

Each entry in the `buyers` array contains:
- `id`, `name`, `client_company`
- `leads_total`, `leads_accepted`, `leads_duplicated`, `leads_failed`, `leads_returned`
- `pings_total`, `pings_accepted`, `pings_failed`
- `total_sell`, `gross_revenue`, `net_revenue`, `returned_revenue`, `net_leads_accepted`

## New Table: `leadprosper_buyer_stats`

**Engine:** `MergeTree` — `ORDER BY (date, campaign_id, buyer_id)`

**Snapshot pattern:** Same as `leadprosper_stats` — on each sync run, insert all rows with the current `fetched_at`, then delete rows where `fetched_at` differs (keeps only the latest snapshot).

| Column | Type | Description |
|---|---|---|
| `fetched_at` | `DateTime64(3, 'UTC')` | Timestamp of the fetch run |
| `date` | `Date` | Date of the stats row |
| `campaign_id` | `String` | LP campaign ID |
| `campaign_name` | `String` | LP campaign name |
| `buyer_id` | `String` | LP buyer ID |
| `buyer_name` | `String` | LP buyer name |
| `leads_total` | `UInt32` | Total leads submitted to this buyer |
| `leads_accepted` | `UInt32` | Leads accepted by this buyer |
| `leads_duplicated` | `UInt32` | Duplicate leads |
| `leads_failed` | `UInt32` | Leads rejected by this buyer |
| `leads_returned` | `UInt32` | Leads returned after acceptance |
| `pings_total` | `UInt32` | Total pings sent to this buyer |
| `pings_accepted` | `UInt32` | Pings accepted by this buyer |
| `pings_failed` | `UInt32` | Pings rejected by this buyer |
| `total_sell` | `Float64` | Total sell-side revenue from this buyer (USD) |
| `gross_revenue` | `Float64` | Gross revenue from this buyer (USD) |
| `net_revenue` | `Float64` | Net revenue from this buyer (USD) |
| `returned_revenue` | `Float64` | Revenue from returned leads (USD) |
| `net_leads_accepted` | `UInt32` | Net accepted leads (accepted minus returned) |

## Changes Required

### 1. `backend/jobs/fetchLeadProsper.js`

After building `allRows` (campaign-level), add a second loop to extract buyer rows from `s.buyers` per campaign per day. Insert buyer rows into `leadprosper_buyer_stats` and delete stale snapshots — same pattern as the existing campaign insert/delete.

Campaigns with an empty `buyers` array are skipped.

### 2. `backend/server.js` — migration

Add `CREATE TABLE IF NOT EXISTS leadprosper_buyer_stats (...)` to the `migrationQueries` array in `POST /api/dev/migrate`.

### 3. `backend/server.js` — new API endpoint

Add `GET /api/stats/leadprosper-buyers` that returns the latest snapshot:

```sql
SELECT * FROM leadprosper_buyer_stats
WHERE fetched_at = (SELECT max(fetched_at) FROM leadprosper_buyer_stats)
ORDER BY date DESC
```

### 4. `docs/clickhouse.md`

Add Table 6 documenting `leadprosper_buyer_stats`.

## What is NOT changing

- `leadprosper_stats` table — untouched
- Existing dashboard — no changes
- Existing `/api/stats/leadprosper` endpoint — untouched
- `fetchLeadProsper.js` campaign-level logic — untouched

## Testing

- Add test case to `fetchLeadProsper.test.js` verifying that when the stats response includes a non-empty `buyers` array, buyer rows are inserted into `leadprosper_buyer_stats` with the correct shape
- Verify campaigns with empty `buyers: []` produce no buyer rows
