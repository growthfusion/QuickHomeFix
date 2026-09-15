import { randomUUID } from 'node:crypto'
import { db, query, insertBatched } from './clickhouse.js'
import { runSync } from './sync.js'
import { chDate, chDateTime } from './normalize.js'

/**
 * Seeds a complete, realistic dataset for development.
 *
 * Runs the real sync path against the mock client rather than inserting
 * rows directly -- so seeding exercises normalization, batching and
 * checkpointing, and a bug in any of them shows up here rather than in
 * production.
 *
 * Then adds adjustment rows covering every branch of the override logic,
 * because those paths are the most error-prone part of the system and
 * must not be first exercised by hand in the UI.
 */

async function truncateAll(log) {
  const tables = [
    'home_service_leads_raw',
    'home_service_buyers',
    'home_service_affiliates',
    'home_service_campaigns',
    'home_service_adjustments',
    'home_service_sync_state',
    'home_service_daily_rollup',
    'home_service_buyer_affiliate_rollup',
  ]
  for (const t of tables) {
    await db.command({ query: `TRUNCATE TABLE IF EXISTS ${t}` })
  }
  log(`cleared ${tables.length} tables`)
}

/**
 * Adjustment fixtures, chosen to cover each case the merge logic must
 * handle rather than to look plausible:
 *
 *   1. a clean cost override inside a single month  (applies)
 *   2. a revenue override on a buyer                 (applies)
 *   3. an override that was later revoked            (must NOT apply)
 *   4. an override superseded by a newer row         (newest wins)
 *   5. a free-text note                              (no money effect)
 */
function buildAdjustments(now) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))

  const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1))
  const prevEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 0))

  const base = {
    period_start: chDate(monthStart),
    period_end: chDate(monthEnd),
    created_by: 'mukilan',
    revoked: 0,
  }

  const t = (minutesAgo) =>
    chDateTime(new Date(now.getTime() - minutesAgo * 60_000))

  return [
    // 1. clean override -- reconciled invoice differed from synced total
    {
      adjustment_id: randomUUID(),
      entity_type: 'affiliate',
      entity_id: 'aff_upyield',
      field: 'cost_override',
      value: '18500.00',
      ...base,
      created_at: t(2880),
    },

    // 2. buyer revenue override
    {
      adjustment_id: randomUUID(),
      entity_type: 'buyer',
      entity_id: 'buy_modernize',
      field: 'revenue_override',
      value: '24750.00',
      ...base,
      created_at: t(2400),
    },

    // 3. revoked -- entered against the wrong affiliate, then withdrawn.
    //    Both rows are kept; the revoking row must win.
    {
      adjustment_id: randomUUID(),
      entity_type: 'affiliate',
      entity_id: 'aff_bangkok',
      field: 'cost_override',
      value: '9999.00',
      ...base,
      created_at: t(1800),
    },
    {
      adjustment_id: randomUUID(),
      entity_type: 'affiliate',
      entity_id: 'aff_bangkok',
      field: 'cost_override',
      value: '9999.00',
      ...base,
      created_at: t(1700),
      revoked: 1,
    },

    // 4. superseded -- corrected twice; only the newest value applies
    {
      adjustment_id: randomUUID(),
      entity_type: 'affiliate',
      entity_id: 'aff_wisdom',
      field: 'cost_override',
      value: '11000.00',
      period_start: chDate(prevStart),
      period_end: chDate(prevEnd),
      created_by: 'adithya',
      revoked: 0,
      created_at: t(1200),
    },
    {
      adjustment_id: randomUUID(),
      entity_type: 'affiliate',
      entity_id: 'aff_wisdom',
      field: 'cost_override',
      value: '11450.00',
      period_start: chDate(prevStart),
      period_end: chDate(prevEnd),
      created_by: 'adithya',
      revoked: 0,
      created_at: t(600),
    },

    // 5. note -- annotation only, must not touch any figure
    {
      adjustment_id: randomUUID(),
      entity_type: 'buyer',
      entity_id: 'buy_leaffilter',
      field: 'note',
      value: 'Paused pending contract renewal. Do not chase invoice.',
      ...base,
      created_at: t(300),
    },
  ]
}

async function summarize(log) {
  const [totals] = await query(`
    SELECT
      count()                     AS leads,
      countIf(status = 'sold')    AS sold,
      round(sum(cost), 2)         AS cost,
      round(sum(revenue), 2)      AS revenue,
      round(sum(profit), 2)       AS profit,
      min(received_at)            AS first_lead,
      max(received_at)            AS last_lead
    FROM home_service_leads_raw FINAL
  `)

  const byVertical = await query(`
    SELECT vertical,
           count()                AS leads,
           round(sum(revenue), 2) AS revenue,
           round(sum(profit), 2)  AS profit
    FROM home_service_leads_raw FINAL
    GROUP BY vertical
    ORDER BY revenue DESC
  `)

  const zips = await query(`SELECT count() AS n FROM home_service_zip_list`)

  const margin = totals.revenue > 0
    ? ((totals.profit / totals.revenue) * 100).toFixed(1)
    : '0.0'

  log('')
  log('  seeded dataset')
  log('  ' + '-'.repeat(52))
  log(`  window        ${totals.first_lead} -> ${totals.last_lead}`)
  log(`  leads         ${totals.leads}  (${totals.sold} sold, ${((totals.sold / totals.leads) * 100).toFixed(1)}% sell rate)`)
  log(`  cost          $${Number(totals.cost).toLocaleString()}   (owed to affiliates)`)
  log(`  revenue       $${Number(totals.revenue).toLocaleString()}   (owed by buyers)`)
  log(`  profit        $${Number(totals.profit).toLocaleString()}   (${margin}% margin)`)
  log(`  zip list      ${zips[0].n} rows with name+address+zip`)
  log('')
  for (const v of byVertical) {
    log(`    ${v.vertical.padEnd(10)} ${String(v.leads).padStart(6)} leads   $${String(Number(v.revenue).toLocaleString()).padStart(10)} rev   $${String(Number(v.profit).toLocaleString()).padStart(9)} profit`)
  }
  log('')
}

async function seed() {
  const log = console.log
  const now = new Date()

  log('seeding ping-post development data\n')

  await truncateAll(log)

  // Force mock mode -- seeding against the live API would be meaningless
  // and, once the real client exists, potentially expensive.
  process.env.LEADPROSPER_MODE = 'mock'
  await runSync({ log, backfillDays: Number(process.env.MOCK_DAYS ?? 180) })

  const adjustments = buildAdjustments(now)
  await insertBatched('home_service_adjustments', adjustments)
  log(`  adjustments: ${adjustments.length} rows (incl. revoked + superseded cases)`)

  await summarize(log)
  await db.close()
}

seed().catch((err) => {
  console.error('\nseed failed:', err.message)
  process.exit(1)
})
