import { createClient } from '@clickhouse/client'

// Single shared client. ClickHouse pools connections internally, so one
// instance per process is correct -- creating one per call leaks sockets.
export const db = createClient({
  url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
  database: process.env.CLICKHOUSE_DB ?? 'home_service',
  username: process.env.CLICKHOUSE_USER ?? 'hsp',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
  clickhouse_settings: {
    date_time_input_format: 'best_effort',
  },
})

/**
 * Insert rows in batches.
 *
 * ClickHouse strongly prefers few large inserts over many small ones --
 * every insert creates a part, and thousands of tiny parts starve the
 * merge scheduler on a small box. 50k is comfortable for our row widths.
 */
export async function insertBatched(table, rows, batchSize = 50_000) {
  let written = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const values = rows.slice(i, i + batchSize)
    await db.insert({ table, values, format: 'JSONEachRow' })
    written += values.length
  }
  return written
}

export async function query(sql, query_params = {}) {
  const rs = await db.query({ query: sql, query_params, format: 'JSONEachRow' })
  return rs.json()
}
