import './env.js'
import { createServer } from 'node:http'
import { runSync } from './sync.js'

/**
 * Cloud Run HTTP entrypoint.
 *
 * Cloud Scheduler replaces the in-process cron: it POSTs to /sync on
 * the configured schedule. That is deliberate -- a container that
 * schedules its own work must stay warm to be correct, which fights
 * Cloud Run's scale-to-zero and pays for idle time. With Scheduler as
 * the clock, the container starts, syncs, and is free to shut down.
 *
 * Endpoints:
 *   GET  /        liveness -- Cloud Run's default health probe
 *   POST /sync    run one sync   (Scheduler target)
 *   POST /migrate apply migrations (manual, one-off)
 */

const PORT = process.env.PORT ?? 8080

// Cloud Scheduler retries on non-2xx, and a retry that lands while the
// first run is still going would double the API calls against
// LeadProsper's 100/min ceiling. Inserts are idempotent so the DATA
// would survive, but the rate limit would not -- so overlapping runs
// are refused rather than queued.
let running = false

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/') {
    return json(res, 200, { ok: true, service: 'hsp-sync' })
  }

  if (req.method === 'POST' && url.pathname === '/sync') {
    if (running) {
      // 409, not 500: this is a healthy refusal. A 5xx would make
      // Scheduler retry harder and make the overlap worse.
      return json(res, 409, { ok: false, error: 'a sync is already running' })
    }

    running = true
    const startedAt = Date.now()
    try {
      const backfillDays = url.searchParams.has('backfillDays')
        ? Number(url.searchParams.get('backfillDays'))
        : undefined

      const result = await runSync({ backfillDays })
      return json(res, 200, { ok: true, ...result })
    } catch (err) {
      // Log the stack for Cloud Logging, return the message only.
      console.error('sync failed:', err)
      // 500 so Scheduler retries. The next run replays the same window,
      // which is safe precisely because the inserts are idempotent.
      return json(res, 500, {
        ok: false,
        error: err.message,
        seconds: ((Date.now() - startedAt) / 1000).toFixed(1),
      })
    } finally {
      running = false
    }
  }

  if (req.method === 'POST' && url.pathname === '/migrate') {
    try {
      const { migrate } = await import('./migrate.js')
      const applied = await migrate()
      return json(res, 200, { ok: true, applied })
    } catch (err) {
      console.error('migrate failed:', err)
      return json(res, 500, { ok: false, error: err.message })
    }
  }

  json(res, 404, { ok: false, error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`hsp-sync listening on :${PORT}`)
})

// Cloud Run sends SIGTERM before reclaiming an instance. Closing the
// server lets an in-flight sync finish its HTTP response instead of
// having the connection cut mid-run.
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing')
  server.close(() => process.exit(0))
})
