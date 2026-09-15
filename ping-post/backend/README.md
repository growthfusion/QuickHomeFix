# Ping Post API

Express proxy over the LeadProsper API. **No database** -- every request
is answered from their API, with an in-memory cache in front.

## Run

    npm install
    cp .env.example .env      # add LEADPROSPER_API_KEY
    npm run dev               # :8081

## Endpoints

| Route | Source | Notes |
|---|---|---|
| `GET /api/summary?from&to` | `/stats` ×2 | KPIs, daily trend, per-campaign |
| `GET /api/affiliates?from&to` | `/stats` | What we owe, rolled up by client |
| `GET /api/buyers?from&to` | `/stats` | What they owe us, incl. ping/post ratio |
| `GET /api/accounting?from&to` | `/accounting` | LP's invoiced figures -- cross-check |
| `GET /api/campaigns` | `/campaigns` | Config + suppliers + buyers |
| `GET /api/leads?from&to&campaign` | `/leads` | 100/page, pass `cursor` to continue |
| `GET /api/leads/:id` | `/lead/{id}` | Full buyer list |
| `GET /api/zip-list?from&to&campaign` | `/leads` | Walks pages; capped by `maxPages` |
| `GET /api/health` | — | Key status + cache stats |
| `POST /api/cache/clear` | — | Flush after correcting a figure in LP |

`from` and `to` are required on every money endpoint: a figure with no
time window is meaningless.

## Why the cache matters

LeadProsper allows **100 requests/minute for the whole account**. Without
caching, a few people clicking around would exhaust it and everyone
would see errors. TTLs: config 10 min, stats/accounting 60s, leads 30s.
Concurrent requests for the same key share one upstream call.

## Two paths to the same money

`/affiliates` and `/buyers` roll up `/stats`; `/accounting` returns what
LeadProsper actually invoices. Both are exposed because a mismatch is
worth seeing. Verified equal on 2026-08-12 → 09-11:

    /stats rollup   cost $2,252.50   revenue $3,062.54
    /accounting     owed $2,252.50   due     $3,062.54

## Known limits of the no-database design

- **Leads are per-campaign.** Their API takes one campaign id, so there
  is no cross-campaign lead search.
- **Zip list is capped.** Each page is 100 leads and one request against
  the shared budget; the response sets `truncated: true` rather than
  silently returning a partial list.
- **No history.** Figures are whatever LP reports now; nothing is
  retained, so there is no record of what a number was last week.

These are the reasons to add ClickHouse later. The schema for that is in
`../clickhouse/migrations/`.
