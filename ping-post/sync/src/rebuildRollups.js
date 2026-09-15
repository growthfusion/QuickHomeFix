import { db } from './clickhouse.js'

/**
 * Rebuilds the rollup tables from the deduplicated source tables.
 *
 * WHY THIS EXISTS
 *
 * A ClickHouse materialized view fires once per INSERT, on the rows of
 * that insert only -- it has no idea the target table is a
 * ReplacingMergeTree. So when a sync re-fetches an overlapping window
 * (which it does by design: a failed run replays, and the accounting
 * window is deliberately re-read), the same lead is inserted twice.
 * lp_leads correctly keeps one row, but the MV already added the
 * lead's cost and revenue to the SummingMergeTree rollup a second time.
 *
 * The result is silent: no error, no duplicate row, just every figure
 * inflated by however many times that window was synced. A 2x cost
 * figure on an affiliate payout screen is the worst kind of bug --
 * plausible, invisible, and wrong.
 *
 * Rebuilding from `FINAL` reads the deduplicated state and is therefore
 * exact regardless of how many times a window was synced.
 *
 * Cost: a full scan of lp_leads and lp_lead_buyers. At this data volume
 * that is seconds, which is why it runs after every sync rather than on
 * a schedule of its own.
 */

const SOURCES = {
  hs_daily_rollup: `
    SELECT toDate(received_at), campaign_id, supplier_id, vertical,
           count(),
           countIf(status = 'ACCEPTED'),
           countIf(status = 'ERROR'),
           countIf(status = 'DUPLICATED'),
           countIf(returned = 1),
           sum(cost), sum(revenue), sum(profit)
    FROM lp_leads FINAL
    WHERE is_test = 0
    GROUP BY toDate(received_at), campaign_id, supplier_id, vertical`,

  hs_supplier_buyer_rollup: `
    SELECT toDate(received_at), campaign_id, supplier_id, buyer_id, vertical,
           count(),
           countIf(status = 'ACCEPTED'),
           countIf(status = 'ERROR'),
           countIf(returned = 1),
           sumIf(sell_price, status = 'ACCEPTED')
    FROM lp_lead_buyers FINAL
    GROUP BY toDate(received_at), campaign_id, supplier_id, buyer_id, vertical`,

  hs_rejection_rollup: `
    SELECT toDate(received_at), campaign_id, supplier_id, vertical,
           error_code, error_message, count()
    FROM lp_leads FINAL
    WHERE status != 'ACCEPTED' AND is_test = 0
    GROUP BY toDate(received_at), campaign_id, supplier_id, vertical,
             error_code, error_message`,

  hs_geo_rollup: `
    SELECT toDate(received_at), vertical, state, zip_code,
           count(), countIf(status = 'ACCEPTED'), sum(cost), sum(revenue)
    FROM lp_leads FINAL
    WHERE is_test = 0 AND zip_code != ''
    GROUP BY toDate(received_at), vertical, state, zip_code`,

  // Buyer x zip. zip_code/state are only populated on lp_lead_buyers
  // rows synced after 002_buyer_geo.sql landed, so this stays empty for
  // older leads until a backfill (node src/runOnce.js --backfill-days=N)
  // re-syncs them -- same "populated going forward" shape hs_geo_rollup
  // has for lp_leads.
  hs_buyer_geo_rollup: `
    SELECT toDate(received_at), buyer_id, vertical, state, zip_code,
           count(), countIf(status = 'ACCEPTED'), sumIf(sell_price, status = 'ACCEPTED')
    FROM lp_lead_buyers FINAL
    WHERE zip_code != ''
    GROUP BY toDate(received_at), buyer_id, vertical, state, zip_code`,
}

export async function rebuildRollups({ log = console.log } = {}) {
  for (const [table, select] of Object.entries(SOURCES)) {
    // TRUNCATE then INSERT rather than an atomic swap: the rebuild takes
    // seconds and the dashboard is read-only, so a brief window of
    // partial data is preferable to the extra machinery. If that window
    // ever matters, build into a shadow table and EXCHANGE TABLES.
    await db.command({ query: `TRUNCATE TABLE ${table}` })
    await db.command({ query: `INSERT INTO ${table} ${select}` })
  }
  log(`  rollups: rebuilt ${Object.keys(SOURCES).length} tables from deduplicated source`)
}
