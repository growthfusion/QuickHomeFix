/**
 * LeadProsper API client.
 *
 * Docs: https://support.leadprosper.io/article/258-lead-prosper-analytics-api-cheat-sheet
 * Base: https://api.leadprosper.io/public
 * Auth: Authorization: Bearer <token>
 * Rate: 100 requests/minute (enforced below)
 */

const BASE = 'https://api.leadprosper.io/public'

// The documented ceiling is 100/min. Pacing at 90 leaves headroom for
// retries without tripping it -- a 429 mid-sync would abort a run that
// is otherwise cheap to complete slowly.
const MAX_PER_MIN = 90
const MIN_GAP_MS = Math.ceil(60_000 / MAX_PER_MIN)

export function createHttpClient({ apiKey, baseUrl = BASE, timezone = 'America/New_York' } = {}) {
  if (!apiKey) throw new Error('LEADPROSPER_API_KEY is required')

  let lastCall = 0

  async function call(path, params = {}, init = {}) {
    // Simple spacing rather than a token bucket: this job is the only
    // caller and runs single-threaded, so an even gap is enough.
    const wait = lastCall + MIN_GAP_MS - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastCall = Date.now()

    const url = new URL(baseUrl + path)
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }

    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })

    if (res.status === 429) {
      // Back off a full window and retry once. Failing the whole sync
      // over one throttled request would mean re-fetching everything.
      await new Promise((r) => setTimeout(r, 60_000))
      return call(path, params, init)
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`LP ${res.status} ${path}: ${body.slice(0, 200)}`)
    }

    return res.json()
  }

  return {
    name: 'live',
    timezone,

    /** GET /campaigns -- also the source of suppliers and buyers. */
    async fetchCampaigns() {
      return call('/campaigns')
    },

    /** GET /clients -- the billing entities behind suppliers and buyers. */
    async fetchClients() {
      const out = []
      let after = null
      do {
        const res = await call('/clients', { search_after: after })
        const data = res?.data ?? {}
        out.push(...(data.clients ?? []))
        after = data.has_more ? data.search_after : null
      } while (after)
      return out
    },

    /**
     * GET /leads -- one campaign at a time; the API requires a single
     * campaign id, so callers iterate campaigns themselves.
     *
     * Returns 100 per page with a `search_after` token.
     */
    async fetchLeads({ campaignId, startDate, endDate, cursor = null, status, includeTest = false } = {}) {
      if (!campaignId) throw new Error('campaignId is required')

      const res = await call('/leads', {
        campaign: campaignId,
        start_date: startDate,
        end_date: endDate,
        timezone,
        status,
        test: includeTest ? undefined : 0,
        search_after: cursor,
      })

      return {
        leads: res?.leads ?? [],
        nextCursor: res?.search_after ?? null,
      }
    },

    /**
     * GET /accounting -- what we owe each supplier and what each buyer
     * owes us, with returns already netted. This is what LeadProsper
     * invoices on.
     */
    async fetchAccounting({ startDate, endDate, mode, clientType, clientId } = {}) {
      const res = await call('/accounting', {
        start_date: startDate,
        end_date: endDate,
        timezone,
        mode,
        client_type: clientType,
        client: clientId,
      })
      return res?.data ?? []
    },

    /** GET /stats -- campaign/supplier/buyer aggregates, for cross-checking. */
    async fetchStats({ startDate, endDate, campaign, group } = {}) {
      return call('/stats', {
        start_date: startDate,
        end_date: endDate,
        timezone,
        campaign,
        group,
      })
    },
  }
}
