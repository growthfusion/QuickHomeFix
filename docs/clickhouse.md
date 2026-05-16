# ClickHouse — Tables Reference

All tables live in the `default` database on ClickHouse Cloud. Connection is configured via environment variables (`CLICKHOUSE_HOST`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DATABASE`).

---

## Table 1: `QuickHomeFix_leads` (configurable via `CLICKHOUSE_TABLE`)

**Purpose:** Every lead submitted through the `/get-quotes/` landing pages. One row per form submission. Used by the dashboard for State, Device, OS, and daily breakdown views, and by `lp-form-map` to derive form types per LP campaign.

**Engine:** `MergeTree` — `ORDER BY (created_at, id)`

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | Auto-generated lead ID (`generateUUIDv4()`) |
| `service` | `Nullable(String)` | Raw service string from form (e.g. `"bath"`, `"roofing"`) |
| `normalized_service` | `Nullable(String)` | Canonical service code: `BATH_REMODEL`, `ROOFING_ASPHALT`, `WINDOWS`, etc. |
| `first_name` | `Nullable(String)` | Homeowner first name |
| `last_name` | `Nullable(String)` | Homeowner last name |
| `email` | `Nullable(String)` | Homeowner email |
| `phone` | `Nullable(String)` | Normalised phone (10-digit US) |
| `address` | `Nullable(String)` | Street address |
| `city` | `Nullable(String)` | City |
| `state` | `Nullable(String)` | 2-letter US state code (e.g. `TX`) |
| `postal_code` | `Nullable(String)` | 5-digit ZIP |
| `own_home` | `Nullable(String)` | Home ownership: `"own"` or `"rent"` |
| `buy_timeframe` | `Nullable(String)` | Purchase timeframe (e.g. `"Immediately"`, `"1-3 months"`) |
| `is_owner` | `Nullable(UInt8)` | 1 = homeowner, 0 = not |
| `can_make_changes` | `Nullable(UInt8)` | 1 = can authorise work, 0 = cannot |
| `roofing_type` | `Nullable(String)` | Roof type (roofing leads) |
| `roofing_plan` | `Nullable(String)` | LP-normalised roofing plan |
| `roof_count` | `Nullable(String)` | Number of roofs |
| `roof_size` | `Nullable(String)` | Roof size |
| `material` | `Nullable(String)` | Roofing material |
| `number_of_windows` | `Nullable(String)` | Window count (window leads) |
| `windows_project_scope` | `Nullable(String)` | Window replacement scope |
| `window_style` | `Nullable(String)` | Window style preference |
| `opt_in_1` | `Nullable(String)` | LP opt-in field 1 |
| `interest` | `Nullable(String)` | LP interest field |
| `bath_needs` | `Nullable(String)` | Bath project needs |
| `tub_reason` | `Nullable(String)` | Reason for tub replacement |
| `bathshower_type` | `Nullable(String)` | Bath/shower type |
| `bathwall_type` | `Nullable(String)` | Bath wall material |
| `walkin_type` | `Nullable(String)` | Walk-in shower/tub type |
| `gutter_material` | `Nullable(String)` | Gutter material |
| `gutter_type` | `Nullable(String)` | Gutter type |
| `solar_type` | `Nullable(String)` | Solar project type |
| `sun_exposure` | `Nullable(String)` | Solar sun exposure |
| `electric_bill` | `Nullable(String)` | Monthly electric bill range |
| `tag_id` | `Nullable(String)` | LP tag ID |
| `publisher_sub_id` | `Nullable(String)` | Publisher sub-ID from URL params |
| `partner_source_id` | `Nullable(String)` | LP partner source ID |
| `trusted_form_token` | `Nullable(String)` | TrustedForm certificate token |
| `lead_id_token` | `Nullable(String)` | External lead ID token |
| `ping_token` | `Nullable(String)` | LP ping token from ping response |
| `home_phone_consent_language` | `Nullable(String)` | TCPA consent text shown to user |
| `landing_page_url` | `Nullable(String)` | Full URL of the landing page at submission |
| `lp_campaign_id` | `Nullable(String)` | LP campaign ID from URL params |
| `lp_supplier_id` | `Nullable(String)` | LP supplier ID for the campaign |
| `lp_ping_id` | `Nullable(String)` | LP ping ID from ping response |
| `partner_lead_id` | `Nullable(String)` | LP-assigned lead ID after post |
| `partner_delivered` | `Nullable(UInt8)` | 1 = lead accepted by LP buyer, 0 = rejected |
| `partner_payout` | `Nullable(Float64)` | Payout amount from LP (USD); null if 0 |
| `partner_status` | `Nullable(String)` | LP post response status string |
| `client_ip` | `Nullable(String)` | Submitter IP address |
| `user_agent` | `Nullable(String)` | Browser user-agent string |
| `created_at` | `DateTime64(3, 'UTC')` | Submission timestamp (millisecond precision) |

---

## Table 2: `meta_ad_stats`

**Purpose:** Meta Ads performance snapshot. Refreshed every hour. Holds three row types (discriminated by which fields are populated): placement rows, device rows, and region rows. The dashboard reads the latest `fetched_at` snapshot only.

**Engine:** `MergeTree` — `ORDER BY (date, campaign_id, adset_id, ad_id, placement, device, os, state)`

| Column | Type | Description |
|---|---|---|
| `fetched_at` | `DateTime64(3, 'UTC')` | Timestamp of the fetch run that produced this row |
| `date` | `Date` | Ad insight date (`date_start` from Meta) |
| `campaign_id` | `String` | Meta campaign ID |
| `campaign_name` | `String` | Meta campaign name |
| `adset_id` | `String` | Ad set ID (placement rows only) |
| `adset_name` | `String` | Ad set name (placement rows only) |
| `ad_id` | `String` | Ad ID (placement rows only) |
| `ad_name` | `String` | Ad name (placement rows only) |
| `publisher_platform` | `String` | Publisher platform: `facebook`, `instagram`, etc. (placement rows only) |
| `placement` | `String` | Platform position, e.g. `feed`, `story` (placement rows only) |
| `device` | `String` | Device platform: `desktop`, `mobile_android`, etc. (device rows only) |
| `os` | `String` | Impression device / OS (device rows only) |
| `state` | `String` | Reserved; always empty (region rows use `region`) |
| `region` | `String` | US region / state name (region rows only) |
| `clicks` | `UInt32` | Link clicks |
| `impressions` | `UInt32` | Impressions |
| `ctr` | `Float64` | Click-through rate (%) |
| `spend` | `Float64` | Ad spend (USD) |

**Row types:**
- **Placement row**: `publisher_platform` and `placement` are set; `device`, `os`, `region` are empty.
- **Device row**: `device` and `os` are set; `publisher_platform`, `placement`, `region` are empty.
- **Region row**: `region` is set; all other breakdown fields are empty.

---

## Table 3: `leadprosper_stats`

**Purpose:** LeadProsper campaign performance — lead counts and revenue for the current calendar month. Fetched day-by-day (one API call per calendar day). Dashboard reads the latest `fetched_at` snapshot.

**Engine:** `MergeTree` — `ORDER BY (date, campaign_id)`

| Column | Type | Description |
|---|---|---|
| `fetched_at` | `DateTime64(3, 'UTC')` | Timestamp of the fetch run |
| `date` | `Date` | Date of the stats row |
| `campaign_id` | `String` | LP campaign ID |
| `campaign_name` | `String` | LP campaign name |
| `leads_total` | `UInt32` | Total leads submitted |
| `leads_accepted` | `UInt32` | Leads accepted by buyer |
| `leads_failed` | `UInt32` | Leads rejected |
| `leads_returned` | `UInt32` | Leads returned after acceptance |
| `total_buy` | `Float64` | Total buy-side cost (USD) |
| `total_sell` | `Float64` | Total sell-side revenue (USD) |
| `net_profit` | `Float64` | `total_sell - total_buy` (USD) |

---

## Table 4: `redtrack_stats`

**Purpose:** RedTrack traffic and conversion data. Contains multiple row types distinguished by `breakdown_type`. Refreshed every hour. Dashboard reads the latest `fetched_at` snapshot.

**Engine:** `MergeTree` — `ORDER BY (date, breakdown_type, group_key, campaign_id)`

| Column | Type | Description |
|---|---|---|
| `fetched_at` | `DateTime64(3, 'UTC')` | Timestamp of the fetch run |
| `date` | `Date` | Report date |
| `breakdown_type` | `String` | Row type: `daily`, `os`, `device`, `country`, `offer` |
| `group_key` | `String` | The dimension value for non-daily rows (e.g. `"Windows"`, `"mobile"`, `"US"`) |
| `campaign_id` | `String` | RT campaign ID (empty for breakdown rows) |
| `campaign_name` | `String` | RT campaign name (empty for breakdown rows) |
| `landing` | `String` | Lander name (empty for breakdown rows) |
| `lp_views` | `UInt32` | Landing page views |
| `clicks` | `UInt32` | Clicks |
| `conversions` | `UInt32` | Conversions |
| `revenue` | `Float64` | Revenue (USD) |
| `cost` | `Float64` | Cost (USD) |
| `epc` | `Float64` | Earnings per click |
| `roi` | `Float64` | Return on investment (%) |

**Breakdown types:**
- `daily` — one row per date; `group_key` is empty
- `os` — one row per `date × OS`; `group_key` = OS name
- `device` — one row per `date × device type`; `group_key` = device name
- `country` — one row per `date × country`; `group_key` = country/region name
- `offer` — one row per `date × lander/offer`; `group_key` = lander name

---

## Table 5: `campaign_mapping`

**Purpose:** Manual cross-reference linking a Meta campaign ID to an LP campaign ID and a RT source ID. Maintained by the developer — one row per Meta campaign. Used by the Campaign ID table view in the dashboard to join LP revenue to Meta ad spend.

**Engine:** `ReplacingMergeTree(created_at)` — `ORDER BY (meta_campaign_id)`. Re-inserting a row for the same `meta_campaign_id` replaces the old one (newest `created_at` wins). Always query with `FINAL`.

| Column | Type | Description |
|---|---|---|
| `meta_campaign_id` | `String` | Meta campaign ID (primary key) |
| `lp_campaign_id` | `String` | Corresponding LP campaign ID |
| `rt_source_id` | `String` | Corresponding RT source ID |
| `form_type` | `String` | Form type: `bath`, `roof`, `windo`, `other` |
| `label` | `Nullable(String)` | Optional human-readable label |
| `created_at` | `DateTime64(3, 'UTC')` | Row creation time; used as the ReplacingMergeTree version |

---

## Migration

Run `POST /api/dev/migrate` to create all tables if they do not exist. The endpoint also runs safe `ALTER TABLE … ADD COLUMN IF NOT EXISTS` statements for columns added after initial deployment (e.g. `breakdown_type`, `group_key` on `redtrack_stats`).
