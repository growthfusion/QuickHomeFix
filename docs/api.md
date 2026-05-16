# API Reference

This project integrates four external APIs: Meta Graph API (ad analytics), LeadProsper (lead delivery and stats), RedTrack (traffic analytics), and Google Places (address autocomplete proxy). A fifth integration — Thumbtack — is partially implemented for contractor search.

---

## 1. Meta Graph API

**Purpose:** Fetch ad performance data (spend, clicks, impressions) broken down by placement, device, and region.

**Base URL:** `https://graph.facebook.com/v21.0`

**Authentication:** `access_token` query parameter (long-lived user token or system user token).

**Environment variables:**
- `META_ACCESS_TOKEN` — long-lived access token
- `META_AD_ACCOUNT_ID` — ad account ID (without the `act_` prefix)

### Endpoints Used

#### `GET /act_{accountId}/insights`

Called three times in parallel (via `Promise.allSettled`) on each sync run.

**Common parameters:**

| Parameter | Type | Description |
|---|---|---|
| `access_token` | String | Auth token |
| `date_preset` | String | Always `last_30d` |
| `time_increment` | Integer | Always `1` (one row per day) |
| `limit` | Integer | `500` (page size; auto-paginated) |

**Call 1 — Placement breakdown (ad level)**

| Parameter | Value |
|---|---|
| `level` | `ad` |
| `fields` | `campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, date_start, clicks, impressions, ctr, spend` |
| `breakdowns` | `publisher_platform, platform_position` |

**Call 2 — Device breakdown (campaign level)**

| Parameter | Value |
|---|---|
| `level` | `campaign` |
| `fields` | `campaign_id, campaign_name, date_start, clicks, impressions, spend` |
| `breakdowns` | `device_platform, impression_device` |

**Call 3 — Region breakdown (campaign level)**

| Parameter | Value |
|---|---|
| `level` | `campaign` |
| `fields` | `campaign_id, campaign_name, date_start, clicks, impressions, spend` |
| `breakdowns` | `region` |

**Response format:** JSON with a `data` array. Each item is one row. Paginated via `paging.next` cursor — the client automatically follows all pages.

**Key response fields:**

| Field | Type | Description |
|---|---|---|
| `date_start` | String | Date of the row (`YYYY-MM-DD`) |
| `campaign_id` | String | Meta campaign ID |
| `campaign_name` | String | Campaign name |
| `adset_id` | String | Ad set ID (placement call only) |
| `adset_name` | String | Ad set name (placement call only) |
| `ad_id` | String | Ad ID (placement call only) |
| `ad_name` | String | Ad name (placement call only) |
| `publisher_platform` | String | `facebook`, `instagram`, `audience_network`, etc. |
| `platform_position` | String | `feed`, `story`, `reels`, etc. |
| `device_platform` | String | `desktop`, `mobile`, `tablet` |
| `impression_device` | String | `android_smartphone`, `iphone`, `ipad`, etc. |
| `region` | String | US region/state name |
| `clicks` | String | Link clicks (returned as string, cast to Number) |
| `impressions` | String | Impressions (returned as string, cast to Number) |
| `ctr` | String | CTR % (returned as string, cast to Number) |
| `spend` | String | Spend USD (returned as string, cast to Number) |

---

## 2. LeadProsper API

**Purpose:** Two separate roles — (a) real-time lead delivery on form submission, and (b) hourly stats sync for the dashboard.

**Base URL:** `https://api.leadprosper.io`

**Authentication (stats sync):** `Authorization: Bearer {LEADPROSPER_API_KEY}` header.

**Authentication (lead delivery):** Per-campaign credentials (`campaign_id`, `supplier_id`, `key`) passed in the request body.

**Environment variables:**
- `LEADPROSPER_API_KEY` — bearer token for stats endpoints
- `LP_CAMPAIGNS_*` — per-service campaign credentials (set in `.env` as structured JSON)
- `LP_TEST_MODE` — if `"true"`, leads are sent in test mode (not billed)

---

### Lead Delivery Endpoints

#### `POST /ping`

Pre-qualifies a lead before full submission.

**Request body (JSON):**

| Field | Description |
|---|---|
| `campaign_id` | LP campaign ID |
| `supplier_id` | LP supplier ID |
| `key` | LP campaign key |
| `first_name`, `last_name`, `email`, `phone` | Lead contact info |
| `address`, `city`, `state`, `postalCode` | Lead location |
| `ip_address`, `user_agent` | Technical fields |
| `landing_page_url`, `lp_campaign_id` | Traffic attribution |
| Service-specific fields | `RoofingPlan`, `NumberOfWindows`, `Interest`, etc. |

**Response:**
- `status`: `"accepted"` or `"rejected"`
- `ping_id` / `token`: used in the subsequent POST call

#### `POST /post`

Full lead submission after a successful ping.

**Request body:** Same structure as ping, plus `ping_id`/`token` from ping response.

**Response:**
- `status`: `"accepted"` or `"rejected"`
- `lead_id`: LP-assigned lead ID
- `payout`: Buyer payout (USD); may be 0

#### `POST /direct_post`

Used for service types that skip the ping step (e.g. some bath/shower campaigns). Single call with full lead data.

**Request body:** Same as POST.

---

### Stats Sync Endpoints

#### `GET /public/stats`

Returns campaign-level lead counts for a date range.

**Query parameters:**

| Parameter | Description |
|---|---|
| `start_date` | `YYYY-MM-DD` |
| `end_date` | `YYYY-MM-DD` |

**Response:** Array of campaign stat objects.

| Field | Description |
|---|---|
| `campaign.id` | LP campaign ID |
| `campaign.name` | Campaign name |
| `leads_total` | Total leads submitted |
| `leads_accepted` | Accepted by buyer |
| `leads_failed` | Rejected |
| `leads_returned` | Returned after acceptance |

#### `GET /public/accounting`

Returns revenue data for a date range.

**Query parameters:**

| Parameter | Value / Description |
|---|---|
| `start_date` | `YYYY-MM-DD` |
| `end_date` | `YYYY-MM-DD` |
| `client_type` | Always `buyers` |
| `mode` | Always `granular` |

**Response:** Array of accounting objects keyed by `campaign_id`.

| Field | Description |
|---|---|
| `campaign_id` | LP campaign ID (join key to stats) |
| `total_buy` | Buy-side cost (USD) |
| `total_sell` | Sell-side revenue (USD) |
| `net_profit` | `total_sell - total_buy` |

**Sync logic:** `fetchLeadProsper` fetches every calendar day of the current month via `Promise.allSettled`. Stats and accounting are fetched in parallel per day, then merged on `campaign_id`.

---

## 3. RedTrack API

**Purpose:** Traffic analytics — landing page views, clicks, conversions, revenue, and cost broken down by date, OS, device, country, and offer/lander.

**Base URL:** `https://api.redtrack.io`

**Authentication:** `api_key` query parameter.

**Environment variables:**
- `REDTRACK_API_KEY` — API key
- `RT_CALL_DELAY_MS` — delay (ms) between sequential API calls (default: `800`)

### Endpoints Used

#### `GET /traffic_sources`

Fetches all traffic source configurations. Used to resolve source names and lander names for the 7 QHF channels.

**Query parameters:**

| Parameter | Description |
|---|---|
| `api_key` | Auth key |
| `limit` | `200` |

**Response:** Array of traffic source objects. Key fields: `_id`/`id`, `name`, `lander.name`, `offer.name`.

Only sources whose IDs are in the QHF hardcoded set of 7 source IDs are used.

#### `GET /report`

Returns aggregated traffic report. Called 5 times sequentially (with 800 ms delay between calls) per sync run.

**Query parameters:**

| Parameter | Description |
|---|---|
| `api_key` | Auth key |
| `date_from` | `YYYY-MM-DD` (30 days ago) |
| `date_to` | `YYYY-MM-DD` (today) |
| `group[]` | One or more grouping dimensions (array; repeated param) |

**5 calls made per sync:**

| Call | `group[]` values | Produces |
|---|---|---|
| Daily totals | `date` | One row per date |
| OS breakdown | `date`, `os` | One row per date × OS |
| Device breakdown | `date`, `device` | One row per date × device |
| Country breakdown | `date`, `country` | One row per date × country |
| Offer/lander | `date`, `offer` | One row per date × lander |

**Response:** Array of report rows. Key fields:

| Field | Description |
|---|---|
| `date` | Report date (`YYYY-MM-DD`) |
| `os` / `os_family` | OS name (OS call) |
| `device` / `device_type` | Device type (device call) |
| `country` / `country_name` | Country (country call) |
| `offer` / `lander` / `offer_name` | Lander/offer name (offer call) |
| `lp_views` | Landing page views |
| `clicks` | Clicks |
| `conversions` | Conversions |
| `revenue` | Revenue (USD) |
| `cost` | Cost (USD) |
| `epc` | Earnings per click |
| `roi` | ROI (%) |

**Note:** Calls are sequential (not parallel) to avoid RT API rate-limiting (429 errors on concurrent requests).

---

## 4. Google Places API (proxied)

**Purpose:** Address autocomplete for the lead forms. The backend proxies requests so the API key is never exposed to the browser.

**Environment variable:** `GOOGLE_API_KEY`

**Backend endpoint:** `GET /api/places/autocomplete?input={text}`

Proxies to `https://maps.googleapis.com/maps/api/place/autocomplete/json`.

---

## 5. Thumbtack API (partial)

**Purpose:** Contractor search — used in the upsell flow after lead submission.

**Base URL:** Configured via `THUMBTACK_API_BASE` env var.

**Authentication:** OAuth 2.0 client credentials flow. Token cached in memory with 60-second buffer before expiry.

**Environment variables:** `THUMBTACK_CLIENT_ID`, `THUMBTACK_CLIENT_SECRET`, `THUMBTACK_AUTH_URL`, `THUMBTACK_API_BASE`

**Endpoints proxied:**
- `GET /api/thumbtack/keywords?searchQuery=roofing` → `GET {apiBase}/api/v4/keywords/search`
- `POST /api/thumbtack/businesses` → `POST {apiBase}/api/v4/businesses/search`
