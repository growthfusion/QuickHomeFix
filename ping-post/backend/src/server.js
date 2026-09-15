// Must be first: populates process.env before db.js reads the
// connection settings. ES imports are hoisted, so inline code here
// would run too late.
import './env.js'

import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { finance } from './routes/finance.js'
import { leads } from './routes/leads.js'
import { db, queryOne } from './db.js'

/**
 * Read-only API over ClickHouse.
 *
 * Nothing here calls LeadProsper. The sync service owns that path and
 * writes to ClickHouse; this server only reads. That separation is what
 * keeps dashboard traffic off the account's 100 requests/minute limit,
 * and it is what makes the pre-aggregated questions answerable at all.
 *
 * The one exception is POST /api/adjustments, which writes to
 * hs_adjustments -- our own table, never LeadProsper.
 */
const app = express()
const PORT = Number(process.env.PORT ?? 8081)

app.use(express.json())

// In dev the UI reaches /api through the Vite proxy, so requests are
// same-origin and CORS never applies. This stays for the case where the
// two are deployed to different hosts -- a single named origin, never a
// wildcard, since these responses carry payout figures.
app.use(cors({
  // '+', not ',' -- gcloud's --substitutions is itself a comma-separated
  // key=value list, so a comma here splits into a second, invalid
  // substitution instead of a second origin. '|' looked safer but is a
  // shell pipe operator when this value reaches an unquoted command
  // line, which truncates the whole gcloud invocation after it.
  origin: (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5180').split('+'),
}))

app.get('/api/health', async (_req, res) => {
  try {
    const row = await queryOne('SELECT version() AS version, currentDatabase() AS db')
    const [{ synced_at } = {}] = await import('./db.js')
      .then((m) => m.query('SELECT max(updated_at) AS synced_at FROM lp_sync_state'))
      .catch(() => [{}])

    res.json({
      ok: true,
      source: 'clickhouse',
      database: row?.db,
      clickhouse_version: row?.version,
      // Surfaced because a dashboard showing stale figures looks
      // identical to one showing current ones.
      last_sync: synced_at ?? null,
    })
  } catch (err) {
    res.status(503).json({ ok: false, source: 'clickhouse', error: err.message })
  }
})

app.use('/api', finance)
app.use('/api', leads)

// In production the built UI ships inside this image and is served from
// the same origin, so the browser never makes a cross-origin call and
// CORS is irrelevant. In dev the folder does not exist and Vite serves
// the UI instead.
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

if (existsSync(PUBLIC)) {
  app.use(express.static(PUBLIC))

  // SPA fallback: the router owns these paths, so anything that is not
  // /api and not a real file must return index.html rather than a 404,
  // or a hard refresh on /buyers breaks.
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(PUBLIC, 'index.html')))
}

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// Errors carry their own status where the cause is known -- 400 for a
// bad range or filter, 404 for a missing lead -- so the UI can say
// something useful instead of a generic failure.
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500
  if (status >= 500) console.error(err)
  res.status(status).json({ error: err.message ?? 'Internal error' })
})

const server = app.listen(PORT, () => {
  console.log(`ping-post api on :${PORT}  (ClickHouse: ${process.env.CLICKHOUSE_DB ?? 'ping_post'})`)
  if (!process.env.CLICKHOUSE_URL) {
    console.warn('  CLICKHOUSE_URL is not set -- falling back to http://localhost:8123')
  }
})

process.on('SIGTERM', () => {
  server.close(async () => {
    await db.close().catch(() => {})
    process.exit(0)
  })
})
