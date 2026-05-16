# Field Mapping Reference

This document traces every dashboard column and table back to its source API field and any calculations applied.

---

## Dashboard Table Overview

The dashboard (`/dash/form_leads`) renders these table views:

| View | Primary data source |
|---|---|
| Date | `leadprosper_stats` + `meta_ad_stats` + `redtrack_stats` (daily) |
| Form | `leadprosper_stats` + `meta_ad_stats` + `redtrack_stats` |
| LP (Campaign) | `leadprosper_stats` |
| Landing | `redtrack_stats` (offer breakdown) or `leadprosper_stats` fallback |
| Source | `meta_ad_stats` (publisher_platform) |
| Title | `meta_ad_stats` (adset_name) |
| Placement | `meta_ad_stats` (placement) |
| State | `QuickHomeFix_leads` (leads-breakdown) |
| Device | `QuickHomeFix_leads` (leads-breakdown) |
| OS | `QuickHomeFix_leads` (leads-breakdown) |
| Campaign ID | `meta_ad_stats` + `campaign_mapping` + `leadprosper_stats` |

---

## Column Definitions

Each table view renders the same column schema (`lpRow` function). Below is a complete mapping of every column.

### VISITS (index 1)

| Attribute | Value |
|---|---|
| Source | RedTrack API |
| RT API field | `lp_views` from `GET /report?group[]=date` |
| ClickHouse field | `redtrack_stats.lp_views` (breakdown_type = `daily`) |
| Calculation | Summed over the active date range; then proportionally allocated to sub-rows by lead share: `round(totalRtViews × (rowLeads / totalLeads))` |
| Dashboard column | VISITS |

**Note:** For State, Device, and OS views the VISITS column uses the same RT proportional allocation (not breakdown-specific RT data). RT does not provide per-state or per-device lp_views.

### CTR % (index 2)

| Attribute | Value |
|---|---|
| Source | Meta Graph API |
| Meta API field | `ctr` from placement breakdown call |
| ClickHouse field | `meta_ad_stats.ctr` (rows with `publisher_platform` set) |
| Calculation | Weighted average CTR across filtered rows: `sum(ctr × clicks) / sum(clicks)` |
| Dashboard column | CTR, % |

### CLICKS (index 3)

| Attribute | Value |
|---|---|
| Source | Meta Graph API |
| Meta API field | `clicks` from placement breakdown call |
| ClickHouse field | `meta_ad_stats.clicks` |
| Calculation | Sum of clicks for matching rows |
| Dashboard column | CLICKS |

### CR % (index 4)

| Attribute | Value |
|---|---|
| Source | Derived |
| Calculation | `(LEADS / CLICKS) × 100` |
| Dashboard column | CR, % |

### LEADS (index 6)

| Attribute | Value |
|---|---|
| Primary source | LeadProsper API (stats endpoint) |
| LP API field | `leads_accepted` from `GET /public/stats` |
| ClickHouse field | `leadprosper_stats.leads_accepted` |
| Calculation | Sum of `leads_accepted` for matching rows |
| State/Device/OS source | `QuickHomeFix_leads` |
| Leads field | `count()` grouped by state/device/os from `leads-breakdown` endpoint |
| Dashboard column | LEADS |

**Form-type derivation (for LP rows):**
- First checks `lp-form-map`: groups `QuickHomeFix_leads` by `lp_campaign_id`, derives form type from `normalized_service` or `landing_page_url`.
- Falls back to `inferForm(campaign_name)`: keyword match on `bath/shower/tub`, `roof`, `window` in the LP campaign name.

### SOLD (index 7)

| Attribute | Value |
|---|---|
| Primary source | LeadProsper API (stats endpoint) |
| LP API field | Not directly — `leads_accepted` treated as sold in LP view |
| Leads table source | `QuickHomeFix_leads.partner_delivered` |
| Calculation | `sum(partner_delivered)` — count of leads where LP buyer accepted |
| Dashboard column | SOLD |

### ACC % (index 8)

| Attribute | Value |
|---|---|
| Source | Derived |
| Calculation | `(SOLD / LEADS) × 100` |
| Dashboard column | ACC % (acceptance rate) |

### TOTAL REVENUE (index 21)

| Attribute | Value |
|---|---|
| Primary source | LeadProsper API (accounting endpoint) |
| LP API field | `total_sell` from `GET /public/accounting` (mode=granular) |
| ClickHouse field | `leadprosper_stats.total_sell` |
| Leads table source | `QuickHomeFix_leads.partner_payout` |
| Calculation | Sum of `total_sell` for matching LP rows; sum of `partner_payout` for State/Device/OS rows |
| Dashboard column | TOTAL REVENUE |

### LEADS $ (index 22)

Same value as TOTAL REVENUE in the current implementation (LP sell revenue = lead revenue).

### COST $ (index 23)

| Attribute | Value |
|---|---|
| Source | Meta Graph API |
| Meta API field | `spend` from placement breakdown call |
| ClickHouse field | `meta_ad_stats.spend` |
| Calculation | Sum of spend for matching rows |
| Dashboard column | COST, $ |

### ADJUSTMENT $ (index 26) — shown as "PROFIT"

| Attribute | Value |
|---|---|
| Source | Derived |
| Calculation | `TOTAL REVENUE - COST $` |
| Dashboard column | ADJUSTMENT, $ |

### AVG PER LEAD (index 27)

| Attribute | Value |
|---|---|
| Source | Derived |
| Calculation | `TOTAL REVENUE / LEADS` |
| Dashboard column | AVG PER LEAD |

### AVG PER SOLD (index 28)

| Attribute | Value |
|---|---|
| Source | Derived |
| Calculation | `TOTAL REVENUE / SOLD` |
| Dashboard column | AVG PER SOLD |

### EPC $ (index 29)

| Attribute | Value |
|---|---|
| Source | Derived |
| Calculation | `TOTAL REVENUE / CLICKS` |
| Dashboard column | EPC, $ |

### EPV $ (index 30) — Earnings Per Visit

| Attribute | Value |
|---|---|
| Source | Derived |
| Calculation | `TOTAL REVENUE / VISITS` |
| Dashboard column | EPV, $ |

---

## State / Device / OS Table Mappings

These three views source data exclusively from `QuickHomeFix_leads` via `GET /api/stats/leads-breakdown`.

### State table

| Dashboard field | Source field | Derivation |
|---|---|---|
| Row label | `QuickHomeFix_leads.state` | 2-letter US state code stored at lead submission |
| LEADS | `count()` | Count of leads grouped by `state, form_type, date` |
| SOLD | `sum(partner_delivered)` | Leads where LP buyer accepted |
| REVENUE | `sum(partner_payout)` | LP payout per lead (null if 0) |
| VISITS | `redtrack_stats.lp_views` (daily) | RT total views × (state leads / total leads) |

### Device table

| Dashboard field | Source field | Derivation |
|---|---|---|
| Row label | Derived from `user_agent` | `multiIf(user_agent LIKE '%Mobile%' OR '%Android%', 'mobile', 'desktop')` |
| LEADS | `count()` | Count grouped by `device, form_type, date` |
| SOLD / REVENUE | Same as State table | |

### OS table

| Dashboard field | Source field | Derivation |
|---|---|---|
| Row label | Derived from `user_agent` | `multiIf(iPhone/iPad/iPod→ios, Android→android, Windows→windows, Macintosh→macos, other)` |
| LEADS | `count()` | Count grouped by `os, form_type, date` |
| SOLD / REVENUE | Same as State table | |

---

## Campaign ID Table Mapping

This view joins three sources using the `campaign_mapping` table.

| Dashboard field | Source | Derivation |
|---|---|---|
| Row label | `meta_ad_stats.campaign_id` | Grouped by Meta campaign ID |
| CLICKS | `meta_ad_stats.clicks` | Sum of clicks for matching campaign |
| COST | `meta_ad_stats.spend` | Sum of spend for matching campaign |
| LEADS | `leadprosper_stats.leads_accepted` | Via `campaign_mapping.lp_campaign_id` join |
| REVENUE | `leadprosper_stats.total_sell` | Via `campaign_mapping.lp_campaign_id` join |
| VISITS | RT proportional | Total RT views × (campaign leads / total leads) |

**Join path:** `meta_ad_stats.campaign_id` → `campaign_mapping.meta_campaign_id` → `campaign_mapping.lp_campaign_id` → `leadprosper_stats.campaign_id`

---

## Form Type Derivation

Form type (`bath`, `roof`, `windo`, `other`) is used to filter and segment all table views. It is derived differently depending on the data source:

| Source | Derivation method |
|---|---|
| `QuickHomeFix_leads` (breakdown) | ClickHouse `multiIf` on `normalized_service` LIKE patterns |
| LP campaign rows | `lp-form-map` lookup by `lp_campaign_id`, then `inferForm(campaign_name)` fallback |
| Meta ad rows | `inferForm(campaign_name)` — keyword match on `bath/shower/tub`, `roof`, `windo/window` |
| RedTrack rows | `inferForm(campaign_name)` — same keyword match |

**`inferForm` keyword rules:**

| Keywords in name | Form type |
|---|---|
| `bath`, `shower`, `tub` | `bath` |
| `roof` | `roof` |
| `window`, `windo` | `windo` |
| anything else | `other` |

---

## LeadProsper Stats Merge Logic

`fetchLeadProsper` fetches both `/public/stats` and `/public/accounting` per day and merges them:

```
stats row:  { campaign.id, campaign.name, leads_total, leads_accepted, leads_failed, leads_returned }
acct row:   { campaign_id, total_buy, total_sell, net_profit }

merged on: stats.campaign.id === acct.campaign_id
stored as: leadprosper_stats row with all fields
```

---

## RedTrack Breakdown Key Resolution

RedTrack API uses inconsistent field names across API versions. The code checks multiple candidate fields:

| Breakdown | Candidate fields checked |
|---|---|
| OS | `r.os`, `r.os_family`, `r.operating_system` |
| Device | `r.device`, `r.device_type`, `r.device_name` |
| Country | `r.country`, `r.country_name`, `r.region`, `r.geo` |
| Offer/lander | `r.offer`, `r.offer_name`, `r.lander`, `r.lander_name`, `r.landing_name` |

The first non-empty value is used as `group_key`.
