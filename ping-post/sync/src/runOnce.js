import './env.js'
import { runSync } from './sync.js'
import { db } from './clickhouse.js'

/**
 * One sync, then exit. For local runs and manual backfills.
 *
 * In production Cloud Scheduler POSTs /sync on server.js instead -- this
 * is the same work without the HTTP layer.
 *
 * Usage:
 *   npm run sync
 *   node src/runOnce.js --backfill-days=365
 */

const arg = process.argv.find((a) => a.startsWith('--backfill-days='))
const backfillDays = arg ? Number(arg.split('=')[1]) : undefined

try {
  await runSync({ backfillDays })
  await db.close()
} catch (err) {
  console.error('sync failed:', err.message)
  await db.close().catch(() => {})
  process.exit(1)
}
