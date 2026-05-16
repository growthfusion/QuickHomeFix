# System Architecture — QuickHomeFix

---

## Overview

QuickHomeFix is a home improvement lead generation platform. It has two distinct data flows running simultaneously:

1. **Real-time lead flow** — a homeowner fills out a form → backend validates and forwards to LeadProsper → lead stored in ClickHouse.
2. **Analytics sync flow** — three background jobs pull stats from Meta Ads, LeadProsper, and RedTrack every hour → data stored in ClickHouse → dashboard reads and displays it.

---

## Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Browser (homeowner or dashboard user)              │
│                                                                       │
│  /get-quotes/{service}   (lead forms — bath, roof, windows, etc.)    │
│  /dash/form_leads        (analytics dashboard)                        │
└───────────────────────────┬─────────────────────────────────────────┘
                             │ HTTP (port 5000, same origin)
┌────────────────────────────▼────────────────────────────────────────┐
│                   Express Backend  (backend/server.js)               │
│                                                                       │
│  Static serving:  /frontend/**  (HTML, JS, CSS)                      │
│                                                                       │
│  Lead ingestion:  POST /api/leads                                     │
│  Stats APIs:      GET  /api/stats/meta                               │
│                   GET  /api/stats/leadprosper                        │
│                   GET  /api/stats/redtrack                           │
│                   GET  /api/stats/lp-form-map                        │
│                   GET  /api/stats/leads-breakdown                    │
│  Campaign map:    GET/POST/DELETE /api/campaign-mapping              │
│  Utilities:       GET  /api/leads/count                              │
│                   GET  /api/leads/latest                             │
│                   GET  /api/verify-email                             │
│                   GET  /api/places/autocomplete  (proxy)             │
│                   POST /api/dev/migrate                              │
│                   POST /api/dev/force-fetch                          │
│                                                                       │
│  Background jobs (startup + every hour via node-cron 0 * * * *):    │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────────┐  │
│  │ fetchMeta   │   │ fetchLeadProsper │   │   fetchRedTrack      │  │
│  └──────┬──────┘   └────────┬─────────┘   └──────────┬───────────┘  │
└─────────│──────────────────│─────────────────────────│──────────────┘
          │                  │                          │
          ▼                  ▼                          ▼
  Meta Graph API      LeadProsper API            RedTrack API
  v21.0               api.leadprosper.io          api.redtrack.io
  /insights           /public/stats               /report (×5 calls)
  (3 parallel calls)  /public/accounting          /traffic_sources
  placement+device    per day, current month      daily+os+device+
  +region breakdown   Promise.allSettled          country+offer
          │                  │                          │
          └──────────────────┴──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │       ClickHouse Cloud        │
              │                               │
              │  QuickHomeFix_leads           │  ← real-time lead rows
              │  meta_ad_stats                │  ← hourly Meta snapshot
              │  leadprosper_stats            │  ← hourly LP snapshot
              │  redtrack_stats               │  ← hourly RT snapshot
              │  campaign_mapping             │  ← manual cross-ref
              └──────────────────────────────┘
                             │
                             ▼
              Dashboard reads all 5 tables
              via /api/stats/* and /api/stats/leads-breakdown
```

---

## Data Flow 1: Real-Time Lead Ingestion

```
Homeowner fills form
        │
        ▼
POST /api/leads  (JSON body)
        │
        ├─ Zod schema validation (400 on failure)
        ├─ Field normalisation (phone, ZIP, state, service, TCPA text)
        ├─ Resolve LP campaign credentials by normalised service
        │
        ▼
sendLeadProsperPingThenPost()
        │
        ├─ POST /ping  →  LP accepts or rejects
        │       │
        │       ├─ rejected → store lead with partner_delivered=0
        │       │
        │       └─ accepted → POST /post (or /direct_post for some services)
        │                      │
        │                      └─ store lead with partner_delivered=1, payout
        │
        ▼
clickhouse.insert(QuickHomeFix_leads, leadRow)
        │
        ▼
HTTP 201 → { ok, id, partnerDelivery }  returned to browser
```

**Key fields written to `QuickHomeFix_leads`:** `state`, `normalized_service`, `user_agent`, `partner_delivered`, `partner_payout`, `lp_campaign_id`, `landing_page_url`, `created_at`.

---

## Data Flow 2: Analytics Sync (Background Jobs)

All three jobs run together via `Promise.allSettled` on server startup and then at the top of every hour (`0 * * * *` cron). Individual job failures do not block the others.

### fetchMeta

1. Makes 3 parallel `GET /act_{id}/insights` calls to Meta Graph API v21.0:
   - Placement breakdown (ad level, last 30 days, `publisher_platform` + `platform_position`)
   - Device breakdown (campaign level, `device_platform` + `impression_device`)
   - Region breakdown (campaign level, `region`)
2. Auto-paginates each call (follows `paging.next` cursor with `limit=500`).
3. Merges all rows into a single array and inserts into `meta_ad_stats` with the current `fetched_at` timestamp.

### fetchLeadProsper

1. Generates a list of every calendar day in the current month.
2. For each day, fires two parallel calls: `GET /public/stats` and `GET /public/accounting`.
3. All days run via `Promise.allSettled` (failed days are skipped, successful ones are kept).
4. Merges stats and accounting on `campaign_id` and inserts into `leadprosper_stats`.

### fetchRedTrack

1. Makes 6 sequential API calls (800 ms delay between each to avoid 429s):
   - `GET /traffic_sources` — to resolve source/lander names
   - `GET /report?group[]=date` — daily totals
   - `GET /report?group[]=date&group[]=os` — OS breakdown
   - `GET /report?group[]=date&group[]=device` — device breakdown
   - `GET /report?group[]=date&group[]=country` — country breakdown
   - `GET /report?group[]=date&group[]=offer` — lander/offer breakdown
2. Each result set is mapped into `redtrack_stats` rows with a `breakdown_type` discriminator.
3. All rows from all calls are inserted together with the same `fetched_at`.

---

## Data Flow 3: Dashboard Read Path

The dashboard (`/dash/form_leads`) makes 6 parallel `fetch()` calls on page load:

```
Promise.all([
  GET /api/stats/meta             →  meta_ad_stats (latest fetched_at)
  GET /api/stats/leadprosper      →  leadprosper_stats (latest fetched_at)
  GET /api/stats/redtrack         →  redtrack_stats (latest fetched_at)
  GET /api/stats/lp-form-map      →  QuickHomeFix_leads (last 90 days, grouped by lp_campaign_id)
  GET /api/campaign-mapping       →  campaign_mapping FINAL
  GET /api/stats/leads-breakdown  →  QuickHomeFix_leads (last 30 days, 4 parallel CH queries)
])
```

Each response is stored in a JavaScript variable and the dashboard renders entirely client-side from those in-memory arrays. There is no further server communication until the page is reloaded or the user triggers a manual refresh.

---

## How the Three Tools Connect

| Tool | Role | Connected to |
|---|---|---|
| **Meta Ads Manager** | Source of ad spend, clicks, impressions by campaign/placement/device/region | → `meta_ad_stats` → dashboard Source, Device, Placement, Campaign ID tables |
| **LeadProsper** | Real-time lead buyer network (ping/post) and campaign revenue source | → `QuickHomeFix_leads` (real-time), `leadprosper_stats` (hourly) → dashboard LP, Form, Date tables |
| **RedTrack** | Traffic analytics — landing page views, conversions, and cost | → `redtrack_stats` → dashboard Date, Source, Landing, and visit columns in all tables |

**Cross-source joins:**
- **LP ↔ Meta:** The `campaign_mapping` table links a Meta `campaign_id` to an LP `campaign_id`. Without a mapping entry the Campaign ID table cannot show LP revenue for a Meta campaign.
- **LP ↔ RT:** `lp_campaign_id` (from URL params on the landing page) links LP campaigns to RT landers by matching on the offer/lander name in the RT offer breakdown.
- **Leads ↔ LP campaigns:** `lp-form-map` groups `QuickHomeFix_leads` by `lp_campaign_id` and derives the form type from `normalized_service`, replacing keyword-based guessing on campaign names.

---

## Security

- All `/api/` routes are rate-limited to 60 requests per minute per IP.
- Helmet middleware sets security headers on all responses.
- Lead payload validated with Zod schema before any processing.
- `CLICKHOUSE_TABLE` name validated against `^[A-Za-z_][A-Za-z0-9_]*$` at startup.
- LP campaign credentials are stored in env vars, never returned to the browser.
- Google Places API key is server-side only (proxied through `/api/places/autocomplete`).

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Server listen port (default: `5000`) |
| `CLICKHOUSE_HOST` | ClickHouse Cloud hostname or URL |
| `CLICKHOUSE_PORT` | ClickHouse port (default: `8443`) |
| `CLICKHOUSE_PROTOCOL` | `https` or `http` (default: `https`) |
| `CLICKHOUSE_DATABASE` | Database name (default: `default`) |
| `CLICKHOUSE_USERNAME` | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | ClickHouse password |
| `CLICKHOUSE_TABLE` | Leads table name (default: `leads`) |
| `META_ACCESS_TOKEN` | Meta Graph API long-lived token |
| `META_AD_ACCOUNT_ID` | Meta ad account ID (without `act_` prefix) |
| `LEADPROSPER_API_KEY` | LP bearer token for stats endpoints |
| `LP_TEST_MODE` | `"true"` to run LP in test mode |
| `REDTRACK_API_KEY` | RedTrack API key |
| `RT_CALL_DELAY_MS` | Delay between RT API calls in ms (default: `800`) |
| `GOOGLE_API_KEY` | Google Places API key |
| `THUMBTACK_CLIENT_ID` | Thumbtack OAuth client ID |
| `THUMBTACK_CLIENT_SECRET` | Thumbtack OAuth client secret |
| `THUMBTACK_AUTH_URL` | Thumbtack OAuth token URL |
| `THUMBTACK_API_BASE` | Thumbtack API base URL |
| `CORS_ORIGIN` | Comma-separated allowed CORS origins (default: all) |
| `ALLOW_LEAD_WITHOUT_DB` | `"true"` to allow lead submission when ClickHouse is down |
