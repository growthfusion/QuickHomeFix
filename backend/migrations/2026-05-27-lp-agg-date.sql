-- One-shot migration: drop the four LP buyer agg tables so the server's
-- CREATE TABLE IF NOT EXISTS recreates them with the new lead_date column.
-- Run this once in ClickHouse before deploying the corresponding code change.
DROP TABLE IF EXISTS leadprosper_agg_buyer;
DROP TABLE IF EXISTS leadprosper_agg_buyer_state;
DROP TABLE IF EXISTS leadprosper_agg_buyer_city;
DROP TABLE IF EXISTS leadprosper_agg_buyer_postal;
