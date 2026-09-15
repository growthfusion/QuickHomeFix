/**
 * Backend client.
 *
 * The backend proxies LeadProsper directly -- there is no database --
 * so every call here becomes an upstream request unless the backend's
 * cache serves it. Keep the number of distinct calls per screen small.
 */

// Same-origin by default: the dev server proxies /api to the backend,
// and in production the two are served together. An absolute URL is
// only needed if they are ever deployed apart.
const BASE = import.meta.env.VITE_API_URL ?? '/api'

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
async function fetchWithRetry(url, attempts = 3) {
  for (let i = 0; ; i++) {
    try {
      return await fetch(url)
    } catch (err) {
      if (i >= attempts - 1) throw err
      await sleep(400 * (i + 1))
    }
  }
}

async function get(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  const res = await fetchWithRetry(url)
  const body = await res.json().catch(() => ({}))

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

  summary: ({ from, to }) => get('/summary', { from, to }),
  affiliates: ({ from, to }) => get('/affiliates', { from, to }),
  buyers: ({ from, to }) => get('/buyers', { from, to }),
  accounting: ({ from, to }) => get('/accounting', { from, to }),

  campaigns: () => get('/campaigns'),

  // LeadProsper only returns leads for one campaign at a time and pages
  // with an opaque token, so callers must supply a campaign and carry
  // the cursor forward themselves.
  leads: ({ from, to, campaign, cursor, status, supplier }) =>
    get('/leads', { from, to, campaign, cursor, status, supplier }),

  lead: (id) => get(`/leads/${id}`),

  zipList: ({ from, to, campaign, maxPages }) =>
    get('/zip-list', { from, to, campaign, maxPages }),
}
