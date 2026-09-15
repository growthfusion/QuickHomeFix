/**
 * Backend client.
 *
 * The backend proxies LeadProsper directly -- there is no database --
 * so every call here becomes an upstream request unless the backend's
 * cache serves it. Keep the number of distinct calls per screen small.
 */

// Same-origin by default: the dev server proxies /api to the backend,
// and in production the two are served together. An absolute URL is
// only needed if they are ever deployed apart -- as the ping-post API,
// which is its own Cloud Run service. VITE_API_URL there is set to
// that service's bare origin (no /api suffix, since it is not this
// app's concern which path the API mounts under), so /api is always
// appended here rather than assumed to be part of the given value.
// Getting this wrong is silent: every call still "succeeds" against
// the deployed origin, just at the wrong path, and 404s from the
// server's catch-all handler rather than failing to connect.
const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * A connection refused means the backend is not up *yet* as often as it
 * means it is not up at all -- both servers start together, and the API
 * needs a second longer than Vite. Retrying briefly turns that race
 * into a slightly slower first paint instead of an error the user has
 * to dismiss.
 *
 * Only connection failures are retried. An HTTP error is a real answer
 * and repeating it would just waste the rate limit.
 */
async function fetchWithRetry(url, attempts = 4) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url)
      // 502/503 through the dev proxy is the backend restarting under
      // `node --watch` -- gone for a second or two, not gone. Treat it
      // like a refused connection and try again.
      if ((res.status === 502 || res.status === 503) && i < attempts - 1) {
        await sleep(500 * (i + 1))
        continue
      }
      return res
    } catch (err) {
      if (i >= attempts - 1) throw err
      await sleep(500 * (i + 1))
    }
  }
}

/**
 * Response cache, keyed by full URL.
 *
 * Every navigation back to a page used to refetch everything and show
 * spinners for figures that had not changed. Successful GETs are kept
 * for TTL_MS in memory and in sessionStorage (so a reload or a tab
 * round-trip still paints instantly); callers get the cached body at
 * once and useApi refreshes in the background.
 */
const TTL_MS = 5 * 60_000
const memCache = new Map()

function cacheKey(url) { return 'hsp:' + url }

function readCache(url) {
  const hit = memCache.get(url)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.body
  try {
    const raw = sessionStorage.getItem(cacheKey(url))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.at >= TTL_MS) return null
    memCache.set(url, parsed)
    return parsed.body
  } catch { return null }
}

function writeCache(url, body) {
  const entry = { at: Date.now(), body }
  memCache.set(url, entry)
  try { sessionStorage.setItem(cacheKey(url), JSON.stringify(entry)) } catch { /* quota: memory only */ }
}

/** Manual refresh: drop everything so the next fetches hit the API. */
export function clearCache() {
  memCache.clear()
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith('hsp:')) sessionStorage.removeItem(k)
  } catch { /* nothing to clear */ }
}

function buildUrl(path, params) {
  const url = new URL(BASE + path, window.location.origin)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }
  return url
}

async function get(path, params = {}, { fresh = false } = {}) {
  const url = buildUrl(path, params)
  const key = url.toString()

  if (!fresh) {
    const cached = readCache(key)
    if (cached) return cached
  }

  const res = await fetchWithRetry(url)
  const body = await res.json().catch(() => ({}))
  if (res.ok) writeCache(key, body)

  if (!res.ok) {
    // The backend sets a real status and message -- 400 for a bad
    // range, 429 when LeadProsper throttles us -- so surface that
    // rather than a generic failure the user cannot act on.
    //
    // A 502 with no body is the dev proxy failing to reach the backend,
    // not the backend answering: flag it so the UI can say "start the
    // API" instead of "request failed".
    const err = new Error(body.error ?? `Request failed (${res.status})`)
    err.status = res.status
    err.offline = res.status === 502 && !body.error
    throw err
  }
  return body
}

export const api = {
  health: () => get('/health'),

  summary: ({ from, to, vertical }) => get('/summary', { from, to, vertical }),
  summaryHourly: ({ vertical } = {}) => get('/summary/hourly', { vertical }),
  summarySnapshot: ({ vertical } = {}) => get('/summary/snapshot', { vertical }),
  verticals: ({ from, to } = {}) => get('/verticals', { from, to }),
  affiliates: ({ from, to, vertical }) => get('/affiliates', { from, to, vertical }),
  buyers: ({ from, to, vertical }) => get('/buyers', { from, to, vertical }),
  accounting: ({ from, to }) => get('/accounting', { from, to }),

  affiliateCampaigns: (client_id, { from, to }) => get(`/affiliates/${client_id}/by-campaign`, { from, to }),
  buyerCampaigns: (client_id, { from, to }) => get(`/buyers/${client_id}/by-campaign`, { from, to }),

  campaigns: () => get('/campaigns'),

  // LeadProsper only returns leads for one campaign at a time and pages
  // with an opaque token, so callers must supply a campaign and carry
  // the cursor forward themselves.
  leads: ({ from, to, campaign, cursor, status, supplier }) =>
    get('/leads', { from, to, campaign, cursor, status, supplier }),

  lead: (id) => get(`/leads/${id}`),

  zipList: ({ from, to, campaign, maxPages }) =>
    get('/zip-list', { from, to, campaign, maxPages }),

  zipPerformance: ({ from, to, vertical }) =>
    get('/zip-performance', { from, to, vertical }),
  zipPerformanceByBuyer: ({ from, to, vertical, buyer_id }) =>
    get('/zip-performance/by-buyer', { from, to, vertical, buyer_id }),
}
