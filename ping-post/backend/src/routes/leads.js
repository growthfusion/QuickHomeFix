import { Router } from 'express'
import { query, queryOne, dateRange } from '../db.js'

/**
 * Lead-level endpoints, read-only, served from ClickHouse.
 *
 * The old version paged through LeadProsper one campaign at a time
 * with an opaque token, because their API requires a campaign id and
 * returns 100 rows a page. Reading from our own tables removes both
 * limits: any filter combination, ordinary offset paging, and no cost
 * against the account's rate limit.
 */
export const leads = Router()

const asyncRoute = (fn) => (req, res, next) => fn(req, res, next).catch(next)

const num = (v) => Math.round(Number(v ?? 0) * 100) / 100
const int = (v) => Number(v ?? 0)

// A page size cap exists because the UI's page selector is user
// input: without it a request for 1,000,000 rows would try to
// serialise the whole table into one response.
const MAX_LIMIT = 500

function paging(q) {
  const limit = Math.min(Math.max(Number(q.limit ?? 50), 1), MAX_LIMIT)
  const offset = Math.max(Number(q.offset ?? 0), 0)
  return { limit, offset }
}

/**
 * Filters shared by /leads and /zip-list. Every one is optional.
 */
function leadFilters(q) {
  const clauses = []
  const params = {}

  if (q.campaign) { clauses.push('l.campaign_id = {campaign:UInt64}'); params.campaign = Number(q.campaign) }
  if (q.vertical) { clauses.push('l.vertical = {vertical:String}'); params.vertical = q.vertical }
  if (q.supplier) { clauses.push('l.supplier_id = {supplier:UInt64}'); params.supplier = Number(q.supplier) }
  if (q.status) { clauses.push('l.status = {status:String}'); params.status = String(q.status).toUpperCase() }
  if (q.state) { clauses.push('l.state = {state:String}'); params.state = q.state }
  if (q.zip) { clauses.push('l.zip_code = {zip:String}'); params.zip = q.zip }

  if (q.returned === '1' || q.returned === 'true') clauses.push('l.returned = 1')

  // Free-text search across the contact fields the UI exposes.
  if (q.q) {
    clauses.push(`(
      positionCaseInsensitive(l.first_name, {q:String}) > 0 OR
      positionCaseInsensitive(l.last_name,  {q:String}) > 0 OR
      positionCaseInsensitive(l.email,      {q:String}) > 0 OR
      positionCaseInsensitive(l.phone,      {q:String}) > 0 OR
      l.lead_id = {q:String}
    )`)
    params.q = q.q
  }

  return { sql: clauses.length ? ' AND ' + clauses.join(' AND ') : '', params }
}

/**
 * GET /api/leads -- filterable, paginated lead table.
 */
leads.get('/leads', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)
  const { limit, offset } = paging(req.query)
  const f = leadFilters(req.query)

  // FINAL deduplicates the ReplacingMergeTree. Correct, and acceptable
  // here because the date filter and LIMIT keep the scan small.
  // Split into FROM and WHERE so the JOIN can sit between them --
  // SQL requires FROM ... JOIN ... WHERE, in that order.
  const fromSql = `
    FROM lp_leads AS l FINAL
    LEFT JOIN (
      SELECT lead_id,
             count()                               AS t_pings,
             countIf(status = 'ACCEPTED')          AS t_accepted,
             anyIf(buyer_name, status = 'ACCEPTED') AS t_winner
      FROM lp_lead_buyers FINAL GROUP BY lead_id
    ) lb ON lb.lead_id = l.lead_id`

  const whereSql = `
    WHERE toDate(l.received_at) BETWEEN {from:Date} AND {to:Date}
      AND l.is_test = 0${f.sql}`

  const where = fromSql + whereSql

  const params = { from, to, ...f.params }

  const rows = await query(`
    SELECT
      l.lead_id AS lead_id, l.received_at AS received_at,
      l.campaign_id AS campaign_id, l.campaign_name AS campaign_name,
      l.vertical AS vertical,
      l.status AS status, l.error_code AS error_code,
      l.error_message AS error_message,
      l.returned AS returned, l.return_reason AS return_reason,
      l.supplier_id AS supplier_id, l.supplier_name AS supplier_name,
      l.cost AS cost, l.revenue AS revenue, l.profit AS profit,
      l.first_name AS first_name, l.last_name AS last_name,
      l.email AS email, l.phone AS phone,
      l.city AS city, l.state AS state, l.zip_code AS zip_code,

      -- Ping economics per lead, so the table can show 1/4 rather than
      -- implying every lead reached exactly one buyer.
      lb.t_pings    AS pings,
      lb.t_accepted AS accepted_by,
      lb.t_winner   AS buyer
    ${where}
    ORDER BY l.received_at DESC
    LIMIT {limit:UInt32} OFFSET {offset:UInt32}`,
    { ...params, limit, offset })

  const [{ total }] = await query(`SELECT count() AS total ${where}`, params)

  res.json({
    range: { from, to },
    total: int(total),
    limit,
    offset,
    // The UI has no cursor concept for this table -- it pages by
    // offset -- but api.js still reads nextCursor, so it is reported
    // as the next offset or null at the end.
    nextCursor: offset + rows.length < Number(total) ? String(offset + limit) : null,
    rows: rows.map((r) => ({
      lead_id: r.lead_id,
      received_at: r.received_at,
      campaign_id: int(r.campaign_id),
      campaign_name: r.campaign_name,
      vertical: r.vertical || '(unmapped)',
      status: r.status,
      error_code: int(r.error_code),
      error_message: r.error_message,
      returned: Boolean(Number(r.returned)),
      return_reason: r.return_reason,
      supplier_id: int(r.supplier_id),
      supplier_name: r.supplier_name,
      // The UI labels suppliers "Affiliate".
      affiliate: r.supplier_name,
      // Blank when nobody bought -- the UI renders an em dash.
      buyer: r.buyer || '',
      pings: int(r.pings),
      accepted_by: int(r.accepted_by),
      cost: num(r.cost), revenue: num(r.revenue), profit: num(r.profit),
      name: [r.first_name, r.last_name].filter(Boolean).join(' '),
      email: r.email, phone: r.phone,
      city: r.city, state: r.state, zip_code: r.zip_code,
    })),
  })
}))

/**
 * GET /api/leads/:lead_id -- one lead, with every buyer it was pinged
 * to.
 *
 * The buyers array is the point of the detail view: it shows who was
 * offered the lead, at what price, and who actually bought.
 */
leads.get('/leads/:lead_id', asyncRoute(async (req, res) => {
  const lead_id = String(req.params.lead_id)

  const lead = await queryOne(`
    SELECT * FROM lp_leads FINAL WHERE lead_id = {lead_id:String} LIMIT 1`,
    { lead_id })

  if (!lead) {
    const err = new Error('lead not found')
    err.status = 404
    throw err
  }

  const buyers = await query(`
    SELECT buyer_id, buyer_name, status, error_code, error_message,
           sell_price, returned, return_reason
    FROM lp_lead_buyers FINAL
    WHERE lead_id = {lead_id:String}
    ORDER BY status = 'ACCEPTED' DESC, sell_price DESC`, { lead_id })

  res.json({
    lead: {
      ...lead,
      campaign_id: int(lead.campaign_id),
      supplier_id: int(lead.supplier_id),
      cost: num(lead.cost), revenue: num(lead.revenue), profit: num(lead.profit),
      returned: Boolean(Number(lead.returned)),
      is_test: Boolean(Number(lead.is_test)),
      vertical: lead.vertical || '(unmapped)',
    },
    buyers: buyers.map((b) => ({
      buyer_id: int(b.buyer_id),
      buyer_name: b.buyer_name,
      status: b.status,
      error_code: int(b.error_code),
      error_message: b.error_message,
      sell_price: num(b.sell_price),
      returned: Boolean(Number(b.returned)),
      return_reason: b.return_reason,
    })),
  })
}))

/**
 * GET /api/zip-list -- our own zip list from captured contact data.
 *
 * Served from the hs_zip_list view, which already filters to rows with
 * a usable name, address and zip, and excludes test leads.
 */
leads.get('/zip-list', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)
  const { limit, offset } = paging(req.query)

  const clauses = []
  const params = { from, to }
  if (req.query.vertical) { clauses.push('z.vertical = {vertical:String}'); params.vertical = req.query.vertical }
  if (req.query.state) { clauses.push('z.state = {state:String}'); params.state = req.query.state }
  if (req.query.zip) { clauses.push('z.zip_code = {zip:String}'); params.zip = req.query.zip }

  const where = `
    FROM hs_zip_list AS z
    LEFT JOIN (SELECT lead_id, any(status) AS status FROM lp_leads FINAL GROUP BY lead_id) l
      ON l.lead_id = z.lead_id
    WHERE toDate(z.received_at) BETWEEN {from:Date} AND {to:Date}
    ${clauses.length ? 'AND ' + clauses.join(' AND ') : ''}`

  const rows = await query(`
    SELECT z.lead_id AS lead_id, z.lead_name AS lead_name,
           z.address AS address, z.city AS city, z.state AS state,
           z.zip_code AS zip_code, z.phone AS phone, z.email AS email,
           z.vertical AS vertical, z.campaign_name AS campaign_name,
           z.received_at AS received_at,
           l.status AS status
    ${where}
    ORDER BY z.received_at DESC
    LIMIT {limit:UInt32} OFFSET {offset:UInt32}`,
    { ...params, limit, offset })

  const [{ total }] = await query(`SELECT count() AS total ${where}`, params)

  // CSV is generated here rather than in the browser so an export can
  // cover the whole result set, not just the page on screen.
  if (req.query.format === 'csv') {
    const header = ['lead_id', 'lead_name', 'address', 'city', 'state', 'zip_code', 'phone', 'email', 'vertical', 'campaign_name', 'received_at']
    // Quote every field and double any embedded quote: addresses
    // contain commas, and names contain apostrophes and quotes.
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [header.join(','), ...rows.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="zip-list-${from}_${to}.csv"`)
    return res.send(csv)
  }

  res.json({
    range: { from, to },
    total: int(total),
    limit,
    offset,
    // The zip list is built from our own table, so nothing is skipped
    // and nothing is truncated -- unlike the old per-campaign API walk.
    campaigns_scanned: 0,
    truncated: false,
    truncated_campaigns: [],
    rows,
  })
}))
