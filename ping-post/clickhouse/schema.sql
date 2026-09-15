-- ===================================================================
-- Home Service Ping Post Dashboard -- complete ClickHouse schema
--
-- Target: dedicated `ping_post` database.
-- Every statement is IF NOT EXISTS, so this file is safe to re-run.
--
-- Run top to bottom: the materialized views at the end read from
-- tables defined earlier.
--
-- NAMING: tables mirror LeadProsper vocabulary (supplier/buyer/client)
-- so a figure here can be compared against their own screens without a
-- translation step. The UI labels lp_suppliers as "Affiliates".
-- ===================================================================

CREATE DATABASE IF NOT EXISTS ping_post;

-- NOTE: every object below is explicitly qualified ``.
-- Do not rely on `USE ping_post` -- over the ClickHouse HTTP interface
-- each statement is its own session, so USE does not persist and the
-- statements would silently target whatever the default database is.


-- ===================================================================
-- 1. DIMENSIONS  (GET /public/campaigns, GET /public/clients)
-- ===================================================================

-- The billing entity behind suppliers and buyers. A client can be both
-- at once, which is why money is tracked by direction, not by table.
CREATE TABLE IF NOT EXISTS ping_post.lp_clients
(
    client_id    UInt64,
    company      String,
    full_name    String,
    email        String,
    phone        String,
    synced_at    DateTime
)
ENGINE = ReplacingMergeTree(synced_at)
ORDER BY (client_id);


-- campaign_type changes how the money works: a ping_post_exchange lead
-- is offered to several buyers and bought by at most one.
--
-- `vertical` is stamped on at sync time from hs_campaign_vertical.
-- LeadProsper has no vertical field, so it is our own mapping.
CREATE TABLE IF NOT EXISTS ping_post.lp_campaigns
(
    campaign_id    UInt64,
    name           String,
    public_name    String,
    campaign_type  LowCardinality(String),
    vertical       LowCardinality(String),
    paused         UInt8,
    synced_at      DateTime
)
ENGINE = ReplacingMergeTree(synced_at)
ORDER BY (campaign_id);


-- A supplier is one client participating in one campaign, so the same
-- client appears once per campaign they supply. Group by client_id for
-- "what do we owe Upyield in total".
CREATE TABLE IF NOT EXISTS ping_post.lp_suppliers
(
    supplier_id      UInt64,
    campaign_id      UInt64,
    client_id        UInt64,
    client_name      String,
    nickname         String,
    paused           UInt8,
    test_mode        UInt8,
    account_manager  String,
    synced_at        DateTime
)
ENGINE = ReplacingMergeTree(synced_at)
ORDER BY (supplier_id);


-- real_time_delivery_type says how the lead is handed over.
--
-- cap_daily is Nullable because LeadProsper omits it for uncapped
-- buyers -- storing 0 would read as "capped at zero", the opposite of
-- the truth.
CREATE TABLE IF NOT EXISTS ping_post.lp_buyers
(
    buyer_id                 UInt64,
    campaign_id              UInt64,
    client_id                UInt64,
    client_name              String,
    nickname                 String,
    paused                   UInt8,
    real_time_delivery_type  LowCardinality(String),
    cap_daily                Nullable(UInt32),
    synced_at                DateTime
)
ENGINE = ReplacingMergeTree(synced_at)
ORDER BY (buyer_id);


-- ===================================================================
-- 2. LEADS  (GET /public/leads)
-- ===================================================================

-- One row per lead.
--
-- The buyers a lead was offered to live in lp_lead_buyers, NOT here: a
-- ping-post lead is pinged to several buyers and bought by at most one,
-- so a single buyer_id column would make ping economics invisible.
CREATE TABLE IF NOT EXISTS ping_post.lp_leads
(
    lead_id        String,
    received_at    DateTime,
    campaign_id    UInt64,
    campaign_name  String,
    vertical       LowCardinality(String),

    -- LeadProsper actual statuses -- not sold/rejected/returned.
    -- A return is a separate flag, and "sold" is ACCEPTED plus a buyer
    -- with a sell_price.
    status         LowCardinality(String),
    error_code     UInt32,
    error_message  String,

    validation_error_provider     String,
    validation_error_description  String,

    -- Returns are their own dimension, applied after the sale.
    returned       UInt8,
    return_reason  String,

    is_test        UInt8,
    tags           Array(String),

    supplier_id         UInt64,
    supplier_name       String,
    supplier_client_id  UInt64,

    cost           Decimal(10, 2),
    revenue        Decimal(10, 2),
    profit         Decimal(10, 2),

    -- Contact fields promoted to real columns because the zip list and
    -- lead search query them directly. Everything unpromoted stays in
    -- lead_data, so a campaign adding a question needs no migration.
    first_name     String,
    last_name      String,
    email          String,
    phone          String,
    address        String,
    city           String,
    state          LowCardinality(String),
    zip_code       String,

    -- TCPA / compliance trail. Real columns because these are what gets
    -- subpoenaed, and digging them out of a Map under legal pressure is
    -- not when you want to find they were dropped.
    ip_address     String,
    landing_page   String,
    trusted_form   String,
    jornaya_leadid String,
    tcpa_consent   UInt8,

    lead_data      Map(String, String),

    synced_at      DateTime
)
ENGINE = ReplacingMergeTree(synced_at)
PARTITION BY toYYYYMM(received_at)
ORDER BY (lead_id);


-- One row per (lead, buyer) pair -- where ping-post economics live.
--
-- A lead pinged to five buyers produces five rows, at most one ACCEPTED
-- with a sell_price. PINGED means offered and priced but not bought;
-- counting those as sales would massively overstate revenue.
CREATE TABLE IF NOT EXISTS ping_post.lp_lead_buyers
(
    lead_id          String,
    buyer_id         UInt64,
    buyer_name       String,
    buyer_client_id  UInt64,

    status         LowCardinality(String),
    error_code     UInt32,
    error_message  String,

    sell_price     Decimal(10, 2),
    returned       UInt8,
    return_reason  String,

    -- Denormalised from the lead: enables buyer x supplier and date
    -- filtering without joining a differently-partitioned table.
    received_at    DateTime,
    campaign_id    UInt64,
    supplier_id    UInt64,
    vertical       LowCardinality(String),

    synced_at      DateTime
)
ENGINE = ReplacingMergeTree(synced_at)
PARTITION BY toYYYYMM(received_at)
ORDER BY (lead_id, buyer_id);


-- Sync checkpoint, one row per stream. The leads stream is per-campaign
-- (`leads:33962`) because GET /public/leads requires a single campaign
-- id, so each campaign advances its own watermark independently.
CREATE TABLE IF NOT EXISTS ping_post.lp_sync_state
(
    stream          String,
    last_synced_at  DateTime,
    cursor          String,
    rows_written    UInt64,
    updated_at      DateTime
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (stream);


-- ===================================================================
-- 3. ACCOUNTING  (GET /public/accounting)
-- ===================================================================

-- What we owe each supplier and what each buyer owes us, computed by
-- LeadProsper with returns already netted. This is what they invoice
-- on, so it is authoritative; our own rollups cross-check it and
-- surface discrepancies rather than acting as the source of truth.
--
-- period_start/period_end are stored rather than derived because the
-- API nets returns WITHIN the window -- the same day queried inside two
-- different ranges can legitimately differ.
CREATE TABLE IF NOT EXISTS ping_post.lp_accounting
(
    period_start   Date,
    period_end     Date,

    client_id      UInt64,
    company        String,

    direction      LowCardinality(String),

    campaign_id    UInt64,
    campaign_name  String,

    quantity        UInt64,
    total_amount    Decimal(14, 2),
    returned_leads  UInt64,
    returned_amount Decimal(14, 2),
    net_leads       UInt64,
    net_amount      Decimal(14, 2),
    avg_price       Decimal(10, 4),

    synced_at      DateTime
)
ENGINE = ReplacingMergeTree(synced_at)
PARTITION BY toYYYYMM(period_start)
ORDER BY (period_start, period_end, direction, client_id, campaign_id);


-- ===================================================================
-- 4. OUR OWN TABLES  (not from LeadProsper)
-- ===================================================================

-- campaign_id -> vertical. LeadProsper has no vertical concept, so this
-- is maintained by hand and read by the sync job to stamp `vertical`
-- onto campaigns, leads and lead_buyers.
--
-- ReplacingMergeTree so re-inserting a campaign_id corrects the mapping
-- instead of duplicating it.
CREATE TABLE IF NOT EXISTS ping_post.hs_campaign_vertical
(
    campaign_id  UInt64,
    vertical     LowCardinality(String),
    updated_at   DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (campaign_id);


-- Manual corrections on client records. The ONLY table the dashboard
-- writes to; the sync job never touches it.
--
-- Insert-only: every edit is a new row, never an in-place update.
-- `revoked` exists because an insert-only table cannot delete a
-- mistaken override -- a revoking row supersedes it instead.
--
-- period_start/period_end scope an override to a date range. An
-- override applies only when the query window FULLY CONTAINS that
-- range: a lump-sum correction cannot be sliced across a partial
-- window. That containment rule is the most important piece of
-- correctness in the system.
--
-- entity_id is a LeadProsper client_id -- adjustments are made against
-- the billing entity that gets invoiced, not a per-campaign row.
CREATE TABLE IF NOT EXISTS ping_post.hs_adjustments
(
    adjustment_id  UUID,
    entity_type    LowCardinality(String),
    entity_id      UInt64,
    field          LowCardinality(String),
    value          String,
    period_start   Date,
    period_end     Date,
    created_by     String,
    created_at     DateTime,
    revoked        UInt8 DEFAULT 0
)
ENGINE = MergeTree
ORDER BY (entity_type, entity_id, field, period_start, created_at);


-- Latest adjustment per entity/field/period. Revoked rows are KEPT in
-- the result so callers can distinguish "never adjusted" from
-- "adjusted, then revoked".
--
-- The max() is aliased last_created_at, not created_at: reusing the
-- source column name reads as an aggregate nested inside the argMax
-- calls, and ClickHouse rejects it (ILLEGAL_AGGREGATION).
CREATE VIEW IF NOT EXISTS ping_post.hs_adjustments_latest AS
SELECT
    entity_type,
    entity_id,
    field,
    period_start,
    argMax(value,      created_at) AS value,
    argMax(period_end, created_at) AS period_end,
    argMax(created_by, created_at) AS created_by,
    argMax(revoked,    created_at) AS revoked,
    max(created_at)                AS last_created_at
FROM ping_post.hs_adjustments
GROUP BY entity_type, entity_id, field, period_start;


-- ===================================================================
-- 5. ROLLUPS  (daily only -- no hourly, per the HLD)
-- ===================================================================

-- ROLLUPS ARE REBUILT, NOT INCREMENTALLY MAINTAINED.
--
-- These were materialized views. They are not any more, and must not
-- become them again: a ClickHouse MV fires once per INSERT on that
-- insert's rows, with no knowledge that lp_leads is a
-- ReplacingMergeTree. A re-synced window -- which happens by design,
-- since a failed run replays and the accounting window is deliberately
-- re-read -- inserted the same lead twice, and the MV added its cost
-- and revenue to the SummingMergeTree twice. lp_leads stayed correct
-- while every rollup figure silently doubled.
--
-- sync/src/rebuildRollups.js rebuilds them from `FINAL` after each run,
-- which is exact no matter how many times a window was synced.

-- Daily x campaign x supplier x vertical. Feeds the dashboard KPIs.
--
-- sell_rate and avg_rpl are NOT stored: they are ratios, and summing a
-- ratio across days is wrong. Compute them at query time as
-- sum(revenue) / sum(leads_total).
CREATE TABLE IF NOT EXISTS ping_post.hs_daily_rollup
(
    day             Date,
    campaign_id     UInt64,
    supplier_id     UInt64,
    vertical        LowCardinality(String),

    leads_total     UInt64,
    accepted_count  UInt64,
    error_count     UInt64,
    duplicate_count UInt64,
    returned_count  UInt64,

    cost            Decimal(18, 2),
    revenue         Decimal(18, 2),
    profit          Decimal(18, 2)
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (day, campaign_id, supplier_id, vertical);

-- Supplier x buyer -- "how many leads did Upyield send that Modernize
-- bought".
--
-- Built from lp_lead_buyers so it separates offered from bought:
-- pings_total counts every offer, accepted_count only sales. In the
-- sample, 235 pings produced 37 sales -- conflating them would
-- overstate volume by 6x.
CREATE TABLE IF NOT EXISTS ping_post.hs_supplier_buyer_rollup
(
    day             Date,
    campaign_id     UInt64,
    supplier_id     UInt64,
    buyer_id        UInt64,
    vertical        LowCardinality(String),

    pings_total     UInt64,
    accepted_count  UInt64,
    error_count     UInt64,
    returned_count  UInt64,

    revenue         Decimal(18, 2)
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (day, campaign_id, supplier_id, buyer_id, vertical);

-- Rejection-reason breakdown. Phase 2 per the HLD, but the rollup is
-- cheap and the data is already arriving -- building it now means the
-- history exists when the page is built, instead of starting empty.
CREATE TABLE IF NOT EXISTS ping_post.hs_rejection_rollup
(
    day             Date,
    campaign_id     UInt64,
    supplier_id     UInt64,
    vertical        LowCardinality(String),
    error_code      UInt32,
    error_message   String,

    lead_count      UInt64
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (day, campaign_id, supplier_id, vertical, error_code, error_message);

-- Geography. Also Phase 2 -- same reasoning: accumulate now, build the
-- page later against real history.
CREATE TABLE IF NOT EXISTS ping_post.hs_geo_rollup
(
    day             Date,
    vertical        LowCardinality(String),
    state           LowCardinality(String),
    zip_code        String,

    leads_total     UInt64,
    accepted_count  UInt64,
    cost            Decimal(18, 2),
    revenue         Decimal(18, 2)
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (day, vertical, state, zip_code);

-- ===================================================================
-- 6. ZIP LIST
-- ===================================================================

-- Our own zip list from captured contact data.
--
-- A plain view, not materialized: the rows already live in lp_leads,
-- and duplicating them would double storage and risk drifting from the
-- deduplicated ReplacingMergeTree state.
--
-- FINAL is correct but grows expensive as lp_leads grows. If this view
-- slows down, replace FINAL with GROUP BY lead_id + argMax(col,
-- synced_at) over the same columns.
CREATE VIEW IF NOT EXISTS ping_post.hs_zip_list AS
SELECT
    lead_id,
    concat(first_name, ' ', last_name) AS lead_name,
    address,
    city,
    state,
    zip_code,
    phone,
    email,
    vertical,
    campaign_name,
    received_at
FROM ping_post.lp_leads FINAL
WHERE zip_code   != ''
  AND address    != ''
  AND first_name != ''
  AND is_test     = 0;
