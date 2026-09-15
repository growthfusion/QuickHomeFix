-- ===================================================================
-- Buyer x zip performance.
--
-- lp_lead_buyers already carries campaign_id/supplier_id/vertical
-- denormalised from the parent lead for cheap grouping (see
-- 001_schema.sql); zip_code and state join that same pattern so a
-- buyer's performance can be sliced by zip without joining back to
-- lp_leads.
--
-- These columns are populated going forward from the next sync only.
-- Existing rows read back as '' until a backfill re-syncs them (run
-- `node src/runOnce.js --backfill-days=N` from ping-post/sync, against
-- the real LeadProsper account, whenever ready -- not run automatically
-- by this migration).
-- ===================================================================

ALTER TABLE ping_post.lp_lead_buyers
    ADD COLUMN IF NOT EXISTS zip_code String AFTER vertical;

ALTER TABLE ping_post.lp_lead_buyers
    ADD COLUMN IF NOT EXISTS state LowCardinality(String) AFTER zip_code;

-- One row per (day, buyer, zip, vertical). Mirrors hs_supplier_buyer_rollup's
-- shape and rebuild pattern, just grouped by zip instead of supplier --
-- rebuildRollups.js TRUNCATEs and re-INSERTs this from lp_lead_buyers
-- FINAL on every sync, so it always reflects whatever zip/state values
-- are present at rebuild time.
CREATE TABLE IF NOT EXISTS ping_post.hs_buyer_geo_rollup
(
    day             Date,
    buyer_id        UInt64,
    vertical        LowCardinality(String),
    state           LowCardinality(String),
    zip_code        String,

    leads_total     UInt64,
    accepted_count  UInt64,
    revenue         Decimal(18, 2)
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (day, buyer_id, zip_code, vertical);
