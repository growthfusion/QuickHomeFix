import { createClient } from '@clickhouse/client'

/**
 * ClickHouse client for the read-only API.
 *
 * Replaces the old direct-to-LeadProsper client. Every figure the
 * dashboard shows now comes from our own synced tables, which is what
 * makes the expensive questions answerable at all: no LeadProsper
 * endpoint returns "how many leads did Upyield send that Modernize
 * bought", and `vertical` does not exist on their side.
 *
 * It also removes the rate limit from the read path entirely. Page
 * loads no longer consume the account's 100 requests/minute.
 */
export const db = createClient({
  url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
  database: process.env.CLICKHOUSE_DB ?? 'ping_post',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
  clickhouse_settings: {
    date_time_input_format: 'best_effort',
    // A runaway dashboard query must not be able to stall the cluster
    // for everyone else.
    max_execution_time: 30,
  },
})

/**
 * Parameterised query. Always pass values via `params` rather than
 * interpolating them: these endpoints take user-controlled filters
 * straight off the query string.
 */
export async function query(sql, params = {}) {
  const rs = await db.query({ query: sql, query_params: params, format: 'JSONEachRow' })
  return rs.json()
}

/** Single-row helper. */
export async function queryOne(sql, params = {}) {
  const rows = await query(sql, params)
  return rows[0] ?? null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validates the date window every endpoint accepts.
 *
 * Defaults to the last 30 days. Rejects malformed input with a 400
 * rather than letting ClickHouse fail on a cast, so the UI can say
 * which filter was wrong.
 */
export function dateRange({ from, to } = {}) {
  const today = new Date()
  const def = (d) => d.toISOString().slice(0, 10)

  const end = to ?? def(today)
  const startDefault = new Date(today)
  startDefault.setUTCDate(startDefault.getUTCDate() - 30)
  const start = from ?? def(startDefault)

  for (const [label, v] of [['from', start], ['to', end]]) {
    if (!ISO_DATE.test(v)) {
      const err = new Error(`${label} must be YYYY-MM-DD`)
      err.status = 400
      throw err
    }
  }

  if (start > end) {
    const err = new Error('from must not be after to')
    err.status = 400
    throw err
  }

  return { from: start, to: end }
}

/**
 * Builds the shared filter clause used across the finance endpoints.
 *
 * Returns SQL fragments plus the params to bind. Every filter is
 * optional and absent ones contribute nothing, so one helper serves
 * endpoints with different filter sets.
 */
export function filters(q, { alias = '' } = {}) {
  const p = alias ? alias + '.' : ''
  const clauses = []
  const params = {}

  if (q.vertical) {
    clauses.push(`${p}vertical = {vertical:String}`)
    params.vertical = q.vertical
  }
  if (q.campaign_id) {
    clauses.push(`${p}campaign_id = {campaign_id:UInt64}`)
    params.campaign_id = Number(q.campaign_id)
  }
  if (q.supplier_id) {
    clauses.push(`${p}supplier_id = {supplier_id:UInt64}`)
    params.supplier_id = Number(q.supplier_id)
  }
  if (q.buyer_id) {
    clauses.push(`${p}buyer_id = {buyer_id:UInt64}`)
    params.buyer_id = Number(q.buyer_id)
  }

  return { sql: clauses.length ? ' AND ' + clauses.join(' AND ') : '', params }
}
