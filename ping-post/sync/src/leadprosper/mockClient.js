import {
  VERTICALS, BUYERS, AFFILIATES, VERTICAL_ECONOMICS,
  AFFILIATE_VOLUME_WEIGHT, BUYER_DEMAND_WEIGHT,
  ZIP_POOL, STREET_NAMES, FIRST_NAMES, LAST_NAMES,
} from './fixtures.js'

/**
 * Mock LeadProsper client.
 *
 * Emits the SAME PAYLOAD SHAPE as the real API -- nested supplier{},
 * buyers[], lead_data{}, epoch-ms dates, ACCEPTED/ERROR/DUPLICATED
 * statuses -- so normalize.js, the batch insert and the checkpointing
 * are all exercised for real against generated data. A mock that
 * emitted a convenient flat shape would leave the normalizer untested,
 * which is exactly where a field mapping breaks.
 *
 * Deterministic: the same seed produces the same dataset, so a re-seed
 * is reproducible and tests can assert exact figures.
 */

// Mulberry32 -- small, fast, seedable. Math.random() cannot be seeded,
// which would make every run produce different numbers.
function makeRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
const between = (rng, lo, hi) => lo + rng() * (hi - lo)
const money = (n) => Math.round(n * 100) / 100

function weightedPick(rng, weights) {
  const roll = rng()
  let acc = 0
  for (const [key, weight] of Object.entries(weights)) {
    acc += weight
    if (roll <= acc) return key
  }
  return Object.keys(weights).at(-1)
}

// Stable numeric ids. The real API uses UInt64 everywhere, and the
// ClickHouse columns are UInt64 -- string ids like 'aff_upyield' would
// normalise to 0 and collapse every supplier into one row.
const numericId = (prefix, name) => {
  let h = 0
  for (const ch of prefix + name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h % 900000 + 100000
}

const CLIENT_ID  = (name) => numericId('client', name)
const CAMPAIGN_ID = (aff, v) => numericId('camp', aff + v)
const SUPPLIER_ID = (aff, v) => numericId('supp', aff + v)
const BUYER_ID    = (buy, v) => numericId('buy', buy + v)

/**
 * Daily lead volume with the shape real lead flow has: weekday-heavy,
 * seasonal, plus noise. A flat line would make every trend chart
 * useless for judging whether the UI actually works.
 */
function volumeForDay(rng, date, baseDaily) {
  const dow = date.getUTCDay()
  const weekday = dow === 0 ? 0.55 : dow === 6 ? 0.68 : 1.0

  // Home services peak late spring through summer.
  const month = date.getUTCMonth()
  const seasonal = 0.82 + 0.28 * Math.sin(((month - 2) / 12) * 2 * Math.PI)

  return Math.max(1, Math.round(baseDaily * weekday * seasonal * between(rng, 0.85, 1.15)))
}

/**
 * One lead in LeadProsper's payload shape.
 *
 * The buyers[] array is the important part: a ping-post lead is offered
 * to several buyers (PINGED) and bought by at most one (ACCEPTED). The
 * lead's own revenue is the winning sell_price, or 0 when nobody bought
 * -- while cost is owed to the supplier either way. That asymmetry is
 * the negative margin the dashboard exists to surface.
 */
function makeLead(rng, receivedAt, seq) {
  const vertical = pick(rng, VERTICALS)
  const econ = VERTICAL_ECONOMICS[vertical]

  // Pick the id once, then look it up: calling weightedPick inside the
  // find predicate would re-roll for every candidate and usually match
  // nothing.
  const affId = weightedPick(rng, AFFILIATE_VOLUME_WEIGHT)
  const aff = AFFILIATES.find((a) => a.affiliate_id === affId)
  const cost = money(between(rng, econ.cost[0], econ.cost[1]))

  // Lead-level status. ERROR and DUPLICATED never reach a buyer.
  const roll = rng()
  const status = roll < 0.86 ? 'ACCEPTED' : roll < 0.95 ? 'ERROR' : 'DUPLICATED'

  const errored = status !== 'ACCEPTED'
  const errorCode = errored ? Math.floor(between(rng, 400, 460)) : 0
  const errorMessage = errored
    ? pick(rng, ['Invalid phone', 'Out of coverage area', 'Failed buyer filter', 'Cap reached', 'Duplicate lead'])
    : ''

  // Ping 2-5 buyers. Only an ACCEPTED lead can be bought, and by one.
  const buyers = []
  let revenue = 0

  if (!errored) {
    const pool = [...BUYERS].sort(() => rng() - 0.5).slice(0, Math.floor(between(rng, 2, 6)))
    const winner = rng() < econ.sellRate
      ? weightedPick(rng, BUYER_DEMAND_WEIGHT)
      : null

    for (const b of pool) {
      const won = b.buyer_id === winner
      const price = money(between(rng, econ.revenue[0], econ.revenue[1]))
      // A return happens after the sale, so only a winner can be returned.
      const returned = won && rng() < 0.04

      if (won) revenue = price

      buyers.push({
        id: BUYER_ID(b.buyer_id, vertical),
        name: b.name,
        client: { id: CLIENT_ID(b.name) },
        status: won ? 'ACCEPTED' : 'PINGED',
        error_code: 0,
        error_message: '',
        // Every ping carries a price -- that is the bid. Only the
        // winner's price becomes revenue.
        sell_price: price,
        returned: returned ? 1 : 0,
        return_reason: returned ? pick(rng, ['Bad contact info', 'Wrong service area', 'Not interested']) : '',
      })
    }
  }

  const place = pick(rng, ZIP_POOL)
  const first = pick(rng, FIRST_NAMES)
  const last = pick(rng, LAST_NAMES)
  const has = (p) => rng() < p

  // lead_data is where LeadProsper puts everything campaign-specific.
  // Gaps are deliberate: ~88% populated, because the real payload will
  // not have every field on every lead and the zip list must cope.
  const lead_data = {
    first_name: has(0.88) ? first : '',
    last_name: has(0.88) ? last : '',
    email: has(0.75) ? `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(between(rng, 1, 99))}@example.com` : '',
    phone: has(0.8) ? `(${Math.floor(between(rng, 200, 989))}) ${Math.floor(between(rng, 200, 999))}-${String(Math.floor(between(rng, 0, 9999))).padStart(4, '0')}` : '',
    address: has(0.88) ? `${Math.floor(between(rng, 100, 9999))} ${pick(rng, STREET_NAMES)} ${pick(rng, ['St', 'Ave', 'Rd', 'Dr', 'Ln'])}` : '',
    city: place.city,
    state: place.state,
    zip_code: has(0.94) ? place.zip : '',

    // Compliance trail.
    ip_address: `${Math.floor(between(rng, 12, 223))}.${Math.floor(between(rng, 0, 255))}.${Math.floor(between(rng, 0, 255))}.${Math.floor(between(rng, 1, 254))}`,
    landing_page: `https://lp.example.com/${vertical.toLowerCase()}/quote`,
    trusted_form: has(0.7) ? `https://cert.trustedform.com/${Math.floor(between(rng, 1e14, 9e14))}` : '',
    jornaya_leadid: has(0.65) ? `${Math.floor(between(rng, 1e7, 9e7))}-ABCD-EFGH` : '',
    tcpa_consent: '1',

    // Campaign-specific questions -- these land in the lead_data Map
    // rather than becoming columns.
    homeowner: pick(rng, ['Yes', 'No']),
    timeframe: pick(rng, ['Immediately', '1-3 months', '3-6 months']),
    property_type: pick(rng, ['Single Family', 'Townhouse', 'Condo']),
  }

  return {
    id: `lp${String(receivedAt.getTime()).slice(-11)}${String(seq).padStart(4, '0')}`,
    lead_date_ms: String(receivedAt.getTime()),
    campaign_id: CAMPAIGN_ID(aff.affiliate_id, vertical),
    campaign_name: `${aff.name} - ${vertical}`,

    status,
    error_code: errorCode,
    error_message: errorMessage,
    validation_error_provider: errored && rng() < 0.4 ? 'phone_validation' : '',
    validation_error_description: errored && rng() < 0.4 ? 'Line type not allowed' : '',

    // A lead-level return mirrors the winning buyer's return.
    returned: buyers.some((b) => b.returned) ? 1 : 0,
    return_reason: buyers.find((b) => b.returned)?.return_reason ?? '',

    test: 0,
    tags: [],

    supplier: {
      id: SUPPLIER_ID(aff.affiliate_id, vertical),
      name: aff.name,
      client: { id: CLIENT_ID(aff.name) },
    },

    cost,
    revenue,

    // The buyers this lead was pinged to. normalizeLeadBuyers explodes
    // this into one lp_lead_buyers row each -- omitting it leaves that
    // table empty and the supplier x buyer breakdown unanswerable.
    buyers,

    lead_data,
  }
}

export function createMockClient({ seed = 42, days = 180, baseDaily = 60 } = {}) {
  const rng = makeRng(seed)

  // Generate the full history once, up front, so repeated fetchLeads
  // calls page through a stable dataset rather than inventing new rows.
  const all = []
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - days)

  for (let d = 0; d < days; d++) {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + d)

    const count = volumeForDay(rng, day, baseDaily)
    for (let i = 0; i < count; i++) {
      // Spread arrivals across business hours, where lead flow actually is.
      const at = new Date(day)
      at.setUTCHours(
        Math.floor(between(rng, 7, 21)),
        Math.floor(between(rng, 0, 60)),
        Math.floor(between(rng, 0, 60)),
      )
      all.push(makeLead(rng, at, i))
    }
  }

  all.sort((a, b) => Number(a.lead_date_ms) - Number(b.lead_date_ms))

  // Campaigns carry suppliers[] and buyers[] nested, exactly as
  // GET /public/campaigns does -- that is where both dimensions come
  // from, rather than from endpoints of their own.
  const campaigns = AFFILIATES.flatMap((a) =>
    VERTICALS.map((v) => ({
      id: CAMPAIGN_ID(a.affiliate_id, v),
      name: `${a.name} - ${v}`,
      public_name: `${v} Leads`,
      campaign_type: 'ping_post_exchange',
      paused: a.status === 'paused' ? 1 : 0,
      suppliers: [{
        id: SUPPLIER_ID(a.affiliate_id, v),
        client_id: CLIENT_ID(a.name),
        client_name: a.name,
        nickname: a.name,
        paused: a.status === 'paused' ? 1 : 0,
        test_mode: 0,
      }],
      buyers: BUYERS.map((b) => ({
        id: BUYER_ID(b.buyer_id, v),
        client_id: CLIENT_ID(b.name),
        client_name: b.name,
        nickname: b.name,
        paused: b.status === 'paused' ? 1 : 0,
        real_time_delivery_type: 'ping_post',
        cap_daily: null,
      })),
    })),
  )

  return {
    name: 'mock',
    timezone: 'America/New_York',

    async fetchCampaigns() {
      return campaigns
    },

    async fetchClients() {
      return [...AFFILIATES, ...BUYERS].map((e) => ({
        id: CLIENT_ID(e.name),
        company: e.name,
        full_name: e.name,
        email: `billing@${e.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: '',
      }))
    },

    /**
     * Paged per campaign, matching the real API: GET /public/leads
     * requires a single campaign id, so callers iterate campaigns.
     */
    async fetchLeads({ campaignId, startDate, endDate, cursor = null, pageSize = 5000 } = {}) {
      let rows = all
      if (campaignId) rows = rows.filter((l) => l.campaign_id === Number(campaignId))
      if (startDate) {
        const ms = new Date(startDate).getTime()
        rows = rows.filter((l) => Number(l.lead_date_ms) >= ms)
      }
      if (endDate) {
        // endDate is a date, so include the whole final day.
        const ms = new Date(endDate).getTime() + 86_400_000
        rows = rows.filter((l) => Number(l.lead_date_ms) < ms)
      }

      const offset = cursor ? Number(cursor) : 0
      const page = rows.slice(offset, offset + pageSize)
      const nextOffset = offset + page.length

      return {
        leads: page,
        nextCursor: nextOffset < rows.length ? String(nextOffset) : null,
      }
    },

    /**
     * Accounting aggregated from the generated leads, so the mock's
     * invoice figures agree with its own lead rows. Returns are netted
     * out, the way LeadProsper does it.
     */
    async fetchAccounting({ startDate, endDate } = {}) {
      const from = startDate ? new Date(startDate).getTime() : 0
      const to = endDate ? new Date(endDate).getTime() + 86_400_000 : Infinity
      const rows = all.filter((l) => Number(l.lead_date_ms) >= from && Number(l.lead_date_ms) < to)

      const byClient = new Map()
      const entry = (id, company) => {
        if (!byClient.has(id)) {
          byClient.set(id, { client: { id, company }, owed: { breakdown: [] }, due: { breakdown: [] } })
        }
        return byClient.get(id)
      }
      const bump = (list, campaign_id, campaign_name, amount, returned) => {
        let row = list.find((r) => r.campaign_id === campaign_id)
        if (!row) {
          row = {
            campaign_id, campaign_name,
            quantity: 0, total_amount: 0,
            returned_leads: 0, returned_amount: 0,
            net_leads: 0, net_amount: 0, avg_price: 0,
          }
          list.push(row)
        }
        row.quantity += 1
        row.total_amount = money(row.total_amount + amount)
        if (returned) {
          row.returned_leads += 1
          row.returned_amount = money(row.returned_amount + amount)
        }
        row.net_leads = row.quantity - row.returned_leads
        row.net_amount = money(row.total_amount - row.returned_amount)
        row.avg_price = row.net_leads ? money(row.net_amount / row.net_leads) : 0
      }

      for (const l of rows) {
        // owed: we pay the supplier for every lead, sold or not.
        const sup = entry(l.supplier.client.id, l.supplier.name)
        bump(sup.owed.breakdown, l.campaign_id, l.campaign_name, l.cost, l.returned === 1)

        // due: each buyer that actually bought owes us.
        for (const b of l.buyers ?? []) {
          if (b.status !== 'ACCEPTED') continue
          const buy = entry(b.client.id, b.name)
          bump(buy.due.breakdown, l.campaign_id, l.campaign_name, b.sell_price, b.returned === 1)
        }
      }

      return [...byClient.values()]
    },

    async fetchStats() {
      return { data: [] }
    },
  }
}
