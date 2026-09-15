# Ping Post Dashboard

Finance dashboard over the LeadProsper API. Answers what we owe each
affiliate and what each buyer owes us.

## Run

    npm run install:all     # first time only
    npm run dev             # starts API (:8081) and UI (:5180)

Then open **http://localhost:5180**

Both servers must be running. `npm run dev` starts both; stopping it
stops both. The browser only ever talks to :5180 -- Vite proxies /api
through to the backend, so there is one port to remember and no CORS
to configure.

## Configuration

`backend/.env` (gitignored, created on first setup):

    PORT=8081
    ALLOWED_ORIGIN=http://localhost:5180
    CLICKHOUSE_URL=http://localhost:8123
    CLICKHOUSE_DB=ping_post
    CLICKHOUSE_USER=default
    CLICKHOUSE_PASSWORD=

`sync/.env` holds the LeadProsper key -- that service, not this one,
talks to LeadProsper. Rotate it under Settings -> Developer API Key.

## Layout

    ping-post/
      backend/     Read-only Express API over ClickHouse
      frontend/    React dashboard
      clickhouse/  Schema for the ping_post database
      sync/        Pulls LeadProsper into ClickHouse

## Data source

Reads **ClickHouse** (`ping_post` database), not the LeadProsper API.
The `sync/` service owns the LeadProsper path and writes the tables this
queries. That separation keeps dashboard traffic off the account's 100
requests/minute limit.

`POST /api/adjustments` is the one write, to `hs_adjustments` -- our own
table, never LeadProsper.

## Deployment

Part of the QuickHomeFix repo. Pushing to `prod` deploys it:

- **UI** built into the site image and served at `/ping-post`.
- **API** deployed as its own Cloud Run service
  (`quickhomefix-pingpost-api`).

The UI is gated by the same sign-in as `/dash`. That guard is
client-side only -- it hides the dashboard, it does not protect the API.
See SECURITY.md.

## Finance (the point of the dashboard)

`/finance` is the ledger: what we owe each affiliate and what each
buyer owes us, side by side, with a net position. Click any client to
expand the campaigns behind the figure -- "$2,252.50 to Upyield" is
only checkable once you can see it is 89 leads at $10.85 on Bathroom
plus 49 at $14.50 on Roofing. Exports to CSV at campaign granularity.

These come from LeadProsper's `/accounting` endpoint, net of returns --
the amounts they actually invoice on. The Affiliates and Buyers pages
reach their totals independently by rolling up `/stats`, so the two are
a cross-check on each other. Verified equal:

    ledger (accounting)   owed $2,252.50   due $3,062.54
    tables (stats)        cost $2,252.50   revenue $3,062.54

## Metrics

Everything LeadProsper reports is displayed. Profit is revenue minus
what we pay the affiliate -- our margin on the trade.

Each table has a **Columns** picker: tick what you want to see, grouped
the same way the table bands them. The choice is saved per table in the
browser and survives reloads. Defaults show the everyday figures; the
ping-post and net-of-returns detail is one click away.

**Volume** -- leads, accepted, failed, duplicated, returned, accept
rate (gross and net of returns), return rate.

**Ping post** -- pings sent, pings accepted, pings failed, post ratio,
average bid (weighted by ping volume). Pre-ping counters exist in the
API but are zero on this account.

**Money, gross and net** -- cost, revenue, profit, margin; the returned
amounts; then net cost, net revenue, net profit, net margin. Net
excludes returns and is the figure that gets invoiced. The two differ:
one return in the sample period moved net profit from $812.26 to
$791.33.

**Per-lead** -- CPL (cost per lead received), RPL (revenue per lead
received), RPA (revenue per lead actually sold). The gap between RPL
and RPA is what the acceptance rate costs in cash terms.

**Not available** -- calls, conversions, clicks, CR. Those tabs are
empty on this account, so the UI shows them disabled rather than
filling them with zeroes.

## Two paths to the same money

`/api/affiliates` and `/api/buyers` roll up `/stats`; `/api/accounting`
returns what LeadProsper invoices. Both are exposed so a mismatch is
visible. Verified equal for 2026-08-12 -> 09-11:

    stats rollup    cost $2,252.50   revenue $3,062.54
    accounting      owed $2,252.50   due     $3,062.54

## If a page says "Cannot reach the API"

The backend is not running. `npm run dev` from this folder starts both
servers.

Brief connection failures are retried automatically -- the API takes a
moment longer to come up than Vite does, and that race should not
surface as an error. The message only appears once retries are
exhausted.
