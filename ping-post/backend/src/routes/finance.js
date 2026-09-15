import { Router } from 'express'
import { query, dateRange } from '../db.js'

/**
 * Finance endpoints, read-only, served from ClickHouse.
 *
 * The response shapes here are the frontend's existing contract -- the
 * pages were written against an earlier LeadProsper-proxying backend
 * and are unchanged. Matching them here rather than rewriting seven
 * pages keeps the UI working and the diff small.
 *
 * Two things this file is careful about:
 *
 * 1. RATIOS ARE COMPUTED PER REQUEST, never stored. Summing a stored
 *    sell_rate across days gives the wrong answer; they must be
 *    sum(numerator)/sum(denominator) over the whole window.
 *
 * 2. AGGREGATE ALIASES NEVER REUSE THEIR SOURCE COLUMN NAME.
 *    `sum(cost) AS cost` reads to ClickHouse as an aggregate nested
 *    inside another and is rejected (ILLEGAL_AGGREGATION), so every
 *    aggregate is aliased with a `t_` prefix and mapped back in JS.
 */
export const finance = Router()

const asyncRoute = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// ClickHouse returns Decimal as a string, which JSON cannot represent
// natively. These are display figures rather than ledger entries, so a
// rounded float is fine -- without the rounding, 12.340000000000002
// reaches the UI.
const num = (v) => Math.round(Number(v ?? 0) * 100) / 100
const int = (v) => Number(v ?? 0)
const pct = (n, d) => (Number(d) ? Math.round((Number(n) / Number(d)) * 1000) / 10 : 0)

/**
 * Supplier and buyer rows are per campaign participation, so one client
 * appears several times. The dashboard links on client_id, so figures
 * are grouped by client here -- grouping by supplier_id would show
 * "Upyield" four times with a quarter of the money each.
 */
const SUPPLIER_CLIENT = `
  (SELECT supplier_id, any(client_id) AS cid, any(client_name) AS cname
   FROM lp_suppliers FINAL GROUP BY supplier_id)`

const BUYER_CLIENT = `
  (SELECT buyer_id, any(client_id) AS cid, any(client_name) AS cname
   FROM lp_buyers FINAL GROUP BY buyer_id)`

/**
 * GET /api/summary -- KPIs, daily trend, campaigns and verticals.
 */
finance.get('/summary', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)
  const params = { from, to }
  const where = 'day BETWEEN {from:Date} AND {to:Date}'

  const [k] = await query(`
    SELECT
      sum(leads_total)     AS t_leads,
      sum(accepted_count)  AS t_accepted,
      sum(error_count)     AS t_failed,
      sum(duplicate_count) AS t_dupes,
      sum(returned_count)  AS t_returned,
      sum(cost)            AS t_cost,
      sum(revenue)         AS t_revenue,
      sum(profit)          AS t_profit
    FROM hs_daily_rollup WHERE ${where}`, params)

  const trend = await query(`
    SELECT day,
           sum(leads_total)    AS t_leads,
           sum(accepted_count) AS t_accepted,
           sum(cost)           AS t_cost,
           sum(revenue)        AS t_revenue,
           sum(profit)         AS t_profit
    FROM hs_daily_rollup WHERE ${where}
    GROUP BY day ORDER BY day`, params)

  const campaigns = await query(`
    SELECT
      r.campaign_id          AS campaign_id,
      any(c.name)            AS t_name,
      any(c.vertical)        AS t_vertical,
      sum(r.leads_total)     AS t_leads,
      sum(r.accepted_count)  AS t_accepted,
      sum(r.error_count)     AS t_failed,
      sum(r.returned_count)  AS t_returned,
      sum(r.cost)            AS t_cost,
      sum(r.revenue)         AS t_revenue,
      sum(r.profit)          AS t_profit
    FROM hs_daily_rollup r
    LEFT JOIN (SELECT campaign_id, any(name) AS name, any(vertical) AS vertical
               FROM lp_campaigns FINAL GROUP BY campaign_id) c USING (campaign_id)
    WHERE r.day BETWEEN {from:Date} AND {to:Date}
    GROUP BY campaign_id ORDER BY t_revenue DESC`, params)

  const verticals = await query(`
    SELECT vertical,
           sum(leads_total)    AS t_leads,
           sum(accepted_count) AS t_accepted,
           sum(cost)           AS t_cost,
           sum(revenue)        AS t_revenue,
           sum(profit)         AS t_profit
    FROM hs_daily_rollup WHERE ${where}
    GROUP BY vertical ORDER BY t_revenue DESC`, params)

  const leads = int(k?.t_leads)
  const revenue = num(k?.t_revenue)

  res.json({
    range: { from, to },
    kpis: {
      leads,
      accepted: int(k?.t_accepted),
      sold: int(k?.t_accepted),
      failed: int(k?.t_failed),
      duplicated: int(k?.t_dupes),
      returned: int(k?.t_returned),
      cost: num(k?.t_cost),
      revenue,
      profit: num(k?.t_profit),
      accept_rate: pct(k?.t_accepted, leads),
      sell_rate: pct(k?.t_accepted, leads),
      // The HLD asks for both. They share a base until LeadProsper
      // exposes an "accepted" state distinct from "sold", so they are
      // reported separately now and the UI need not change later.
      acceptance_rate: pct(k?.t_accepted, leads),
      avg_rpl: leads ? num(revenue / leads) : 0,
      margin: pct(k?.t_profit, k?.t_revenue),
    },
    trend: trend.map((t) => ({
      date: t.day,
      leads: int(t.t_leads),
      accepted: int(t.t_accepted),
      sold: int(t.t_accepted),
      cost: num(t.t_cost),
      revenue: num(t.t_revenue),
      profit: num(t.t_profit),
    })),
    campaigns: campaigns.map((r) => ({
      campaign_id: int(r.campaign_id),
      name: r.t_name || `#${r.campaign_id}`,
      vertical: r.t_vertical || '(unmapped)',
      leads: int(r.t_leads),
      accepted: int(r.t_accepted),
      failed: int(r.t_failed),
      returned: int(r.t_returned),
      accept_rate: pct(r.t_accepted, r.t_leads),
      cost: num(r.t_cost),
      revenue: num(r.t_revenue),
      profit: num(r.t_profit),
      margin: pct(r.t_profit, r.t_revenue),
    })),
    verticals: verticals.map((r) => ({
      vertical: r.vertical || '(unmapped)',
      leads: int(r.t_leads),
      accepted: int(r.t_accepted),
      accept_rate: pct(r.t_accepted, r.t_leads),
      cost: num(r.t_cost),
      revenue: num(r.t_revenue),
      profit: num(r.t_profit),
      margin: pct(r.t_profit, r.t_revenue),
      avg_rpl: Number(r.t_leads) ? num(Number(r.t_revenue) / Number(r.t_leads)) : 0,
    })),
  })
}))

/**
 * Manual adjustments for one entity type, keyed by client_id.
 *
 * An override applies only when the query window FULLY CONTAINS the
 * adjustment's period: a lump-sum correction cannot be sliced across a
 * partial window.
 */
async function adjustmentsFor(entity_type, from, to) {
  const rows = await query(`
    SELECT entity_id, field, value
    FROM hs_adjustments_latest
    WHERE entity_type = {entity_type:String} AND revoked = 0
      AND period_start >= {from:Date} AND period_end <= {to:Date}`,
    { entity_type, from, to })

  const byClient = new Map()
  for (const r of rows) {
    const id = Number(r.entity_id)
    if (!byClient.has(id)) byClient.set(id, {})
    byClient.get(id)[r.field] = r.value
  }
  return byClient
}

/**
 * GET /api/affiliates -- what we owe each affiliate.
 *
 * Volume and money come from hs_daily_rollup; ping counts come from
 * hs_supplier_buyer_rollup, because a ping only exists per (lead,
 * buyer) pair. They are queried separately and merged on client_id
 * rather than joined: joining two rollups of different grain would
 * multiply the money by the number of buyers.
 */
finance.get('/affiliates', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)
  const params = { from, to }

  const base = await query(`
    SELECT
      any(s.cid)             AS client_id,
      any(s.cname)           AS t_name,
      sum(r.leads_total)     AS t_leads,
      sum(r.accepted_count)  AS t_accepted,
      sum(r.error_count)     AS t_failed,
      sum(r.duplicate_count) AS t_dupes,
      sum(r.returned_count)  AS t_returned,
      sum(r.cost)            AS t_cost,
      sum(r.revenue)         AS t_revenue,
      sum(r.profit)          AS t_profit
    FROM hs_daily_rollup r
    LEFT JOIN ${SUPPLIER_CLIENT} s USING (supplier_id)
    WHERE r.day BETWEEN {from:Date} AND {to:Date}
    GROUP BY s.cid ORDER BY t_cost DESC`, params)

  const pings = await query(`
    SELECT
      any(s.cid)            AS client_id,
      sum(r.pings_total)    AS t_pings,
      sum(r.accepted_count) AS t_posted,
      sum(r.revenue)        AS t_ping_revenue
    FROM hs_supplier_buyer_rollup r
    LEFT JOIN ${SUPPLIER_CLIENT} s USING (supplier_id)
    WHERE r.day BETWEEN {from:Date} AND {to:Date}
    GROUP BY s.cid`, params)

  // Returned revenue is not in the rollups -- a return is a per-ping
  // flag -- so net figures come from the lead_buyers table.
  const returns = await query(`
    SELECT
      any(s.cid)                          AS client_id,
      sumIf(b.sell_price, b.returned = 1) AS t_returned_revenue
    FROM lp_lead_buyers AS b FINAL
    LEFT JOIN ${SUPPLIER_CLIENT} s USING (supplier_id)
    WHERE toDate(b.received_at) BETWEEN {from:Date} AND {to:Date}
      AND b.status = 'ACCEPTED'
    GROUP BY s.cid`, params)

  const pingBy = new Map(pings.map((p) => [Number(p.client_id), p]))
  const retBy = new Map(returns.map((p) => [Number(p.client_id), p]))
  const adj = await adjustmentsFor('supplier', from, to)

  const rows = base.map((r) => {
    const id = Number(r.client_id)
    const p = pingBy.get(id) ?? {}
    const ret = num(retBy.get(id)?.t_returned_revenue ?? 0)
    const a = adj.get(id) ?? {}

    const cost = a.cost_override != null ? num(a.cost_override) : num(r.t_cost)
    const revenue = num(r.t_revenue)
    // Recomputed rather than read from the rollup: an overridden cost
    // must flow through to profit, or the two disagree on screen.
    const profit = num(revenue - cost)
    const netRevenue = num(revenue - ret)

    return {
      client_id: id,
      name: r.t_name || `#${id}`,
      leads: int(r.t_leads),
      accepted: int(r.t_accepted),
      failed: int(r.t_failed),
      duplicated: int(r.t_dupes),
      returned: int(r.t_returned),
      accept_rate: pct(r.t_accepted, r.t_leads),
      pings_total: int(p.t_pings),
      // What share of pings turned into a post (a sale).
      ping_post_ratio: pct(p.t_posted, p.t_pings),
      avg_bid: Number(p.t_posted) ? num(Number(p.t_ping_revenue) / Number(p.t_posted)) : 0,
      cost,
      revenue,
      profit,
      margin: revenue ? pct(profit, revenue) : 0,
      net_revenue: netRevenue,
      net_profit: num(netRevenue - cost),
      net_margin: netRevenue ? pct(netRevenue - cost, netRevenue) : 0,
      adjustments: a,
    }
  })

  res.json({
    range: { from, to },
    rows,
    totals: {
      leads: rows.reduce((n, r) => n + r.leads, 0),
      accepted: rows.reduce((n, r) => n + r.accepted, 0),
      cost: num(rows.reduce((n, r) => n + r.cost, 0)),
      revenue: num(rows.reduce((n, r) => n + r.revenue, 0)),
      profit: num(rows.reduce((n, r) => n + r.profit, 0)),
      net_revenue: num(rows.reduce((n, r) => n + r.net_revenue, 0)),
      net_profit: num(rows.reduce((n, r) => n + r.net_profit, 0)),
    },
  })
}))

/**
 * GET /api/buyers -- what each buyer owes us.
 *
 * Everything here comes from hs_supplier_buyer_rollup: buyer-level
 * revenue does not exist at lead level, because a lead is pinged to
 * several buyers and bought by at most one.
 */
finance.get('/buyers', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)
  const params = { from, to }

  const base = await query(`
    SELECT
      any(b.cid)            AS client_id,
      any(b.cname)          AS t_name,
      sum(r.pings_total)    AS t_pings,
      sum(r.accepted_count) AS t_accepted,
      sum(r.error_count)    AS t_failed,
      sum(r.returned_count) AS t_returned,
      sum(r.revenue)        AS t_revenue
    FROM hs_supplier_buyer_rollup r
    LEFT JOIN ${BUYER_CLIENT} b USING (buyer_id)
    WHERE r.day BETWEEN {from:Date} AND {to:Date}
    GROUP BY b.cid ORDER BY t_revenue DESC`, params)

  const returns = await query(`
    SELECT
      any(bc.cid)                         AS client_id,
      sumIf(b.sell_price, b.returned = 1) AS t_returned_revenue
    FROM lp_lead_buyers AS b FINAL
    LEFT JOIN ${BUYER_CLIENT} bc USING (buyer_id)
    WHERE toDate(b.received_at) BETWEEN {from:Date} AND {to:Date}
      AND b.status = 'ACCEPTED'
    GROUP BY bc.cid`, params)

  const retBy = new Map(returns.map((p) => [Number(p.client_id), p]))
  const adj = await adjustmentsFor('buyer', from, to)

  const rows = base.map((r) => {
    const id = Number(r.client_id)
    const a = adj.get(id) ?? {}
    const ret = num(retBy.get(id)?.t_returned_revenue ?? 0)
    const revenue = a.revenue_override != null ? num(a.revenue_override) : num(r.t_revenue)

    return {
      client_id: id,
      name: r.t_name || `#${id}`,
      // For a buyer, "leads" means leads they were offered.
      leads: int(r.t_pings),
      accepted: int(r.t_accepted),
      failed: int(r.t_failed),
      returned: int(r.t_returned),
      accept_rate: pct(r.t_accepted, r.t_pings),
      pings_total: int(r.t_pings),
      pings_failed: int(r.t_failed),
      ping_post_ratio: pct(r.t_accepted, r.t_pings),
      revenue,
      returned_revenue: ret,
      net_revenue: num(revenue - ret),
      adjustments: a,
    }
  })

  res.json({
    range: { from, to },
    rows,
    totals: {
      leads: rows.reduce((n, r) => n + r.leads, 0),
      accepted: rows.reduce((n, r) => n + r.accepted, 0),
      revenue: num(rows.reduce((n, r) => n + r.revenue, 0)),
      returned_revenue: num(rows.reduce((n, r) => n + r.returned_revenue, 0)),
      net_revenue: num(rows.reduce((n, r) => n + r.net_revenue, 0)),
    },
    total_revenue: num(rows.reduce((n, r) => n + r.revenue, 0)),
  })
}))

/**
 * GET /api/buyers/:client_id/by-affiliate
 *
 * "How many leads did Upyield send that Modernize bought." No
 * LeadProsper endpoint answers this; it exists only because
 * lp_lead_buyers keeps one row per ping.
 */
finance.get('/buyers/:client_id/by-affiliate', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)
  const client_id = Number(req.params.client_id)

  if (!Number.isInteger(client_id) || client_id <= 0) {
    const err = new Error('client_id must be a positive integer')
    err.status = 400
    throw err
  }

  const rows = await query(`
    SELECT
      any(s.cid)            AS affiliate_client_id,
      any(s.cname)          AS t_name,
      sum(r.pings_total)    AS t_sent,
      sum(r.accepted_count) AS t_sold,
      sum(r.returned_count) AS t_returned,
      sum(r.revenue)        AS t_revenue
    FROM hs_supplier_buyer_rollup r
    LEFT JOIN ${SUPPLIER_CLIENT} s USING (supplier_id)
    LEFT JOIN ${BUYER_CLIENT} b USING (buyer_id)
    WHERE b.cid = {client_id:UInt64}
      AND r.day BETWEEN {from:Date} AND {to:Date}
    GROUP BY s.cid ORDER BY t_revenue DESC`, { client_id, from, to })

  const [name] = await query(
    'SELECT any(client_name) AS n FROM lp_buyers FINAL WHERE client_id = {client_id:UInt64}',
    { client_id })

  res.json({
    buyer: name?.n || `#${client_id}`,
    client_id,
    range: { from, to },
    rows: rows.map((r) => ({
      client_id: int(r.affiliate_client_id),
      name: r.t_name || `#${r.affiliate_client_id}`,
      affiliate: r.t_name || `#${r.affiliate_client_id}`,
      leads_sent: int(r.t_sent),
      leads_sold: int(r.t_sold),
      returned: int(r.t_returned),
      accept_rate: pct(r.t_sold, r.t_sent),
      revenue: num(r.t_revenue),
    })),
  })
}))

/**
 * GET /api/affiliates/:client_id/by-campaign -- one affiliate's
 * campaigns, for the detail page.
 */
finance.get('/affiliates/:client_id/by-campaign', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)
  const client_id = Number(req.params.client_id)

  const rows = await query(`
    SELECT
      r.campaign_id         AS campaign_id,
      any(c.name)           AS t_name,
      sum(r.leads_total)    AS t_leads,
      sum(r.accepted_count) AS t_accepted,
      sum(r.returned_count) AS t_returned,
      sum(r.cost)           AS t_cost,
      sum(r.revenue)        AS t_revenue,
      sum(r.profit)         AS t_profit
    FROM hs_daily_rollup r
    LEFT JOIN ${SUPPLIER_CLIENT} s USING (supplier_id)
    LEFT JOIN (SELECT campaign_id, any(name) AS name FROM lp_campaigns FINAL GROUP BY campaign_id) c
      USING (campaign_id)
    WHERE s.cid = {client_id:UInt64}
      AND r.day BETWEEN {from:Date} AND {to:Date}
    GROUP BY campaign_id ORDER BY t_cost DESC`, { client_id, from, to })

  res.json({
    client_id,
    range: { from, to },
    rows: rows.map((r) => ({
      campaign_id: int(r.campaign_id),
      campaign_name: r.t_name || `#${r.campaign_id}`,
      name: r.t_name || `#${r.campaign_id}`,
      leads: int(r.t_leads),
      accepted: int(r.t_accepted),
      returned: int(r.t_returned),
      cost: num(r.t_cost),
      revenue: num(r.t_revenue),
      profit: num(r.t_profit),
    })),
  })
}))

/**
 * GET /api/campaigns -- campaign table.
 *
 * api.js calls this with no date range, so it defaults to the last 30
 * days like every other endpoint. Campaigns with no activity in the
 * window still appear, with zeroes, because a paused campaign
 * disappearing from the list reads as "deleted" rather than "quiet".
 */
finance.get('/campaigns', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)

  const rows = await query(`
    SELECT
      c.campaign_id         AS campaign_id,
      any(c.name)           AS t_name,
      any(c.campaign_type)  AS t_type,
      any(c.vertical)       AS t_vertical,
      any(c.paused)         AS t_paused,
      sum(r.leads_total)    AS t_leads,
      sum(r.accepted_count) AS t_accepted,
      sum(r.error_count)    AS t_failed,
      sum(r.returned_count) AS t_returned,
      sum(r.cost)           AS t_cost,
      sum(r.revenue)        AS t_revenue,
      sum(r.profit)         AS t_profit
    FROM (SELECT campaign_id, any(name) AS name, any(campaign_type) AS campaign_type,
                 any(vertical) AS vertical, any(paused) AS paused
          FROM lp_campaigns FINAL GROUP BY campaign_id) c
    LEFT JOIN (SELECT campaign_id, leads_total, accepted_count, error_count,
                      returned_count, cost, revenue, profit
               FROM hs_daily_rollup
               WHERE day BETWEEN {from:Date} AND {to:Date}) r USING (campaign_id)
    GROUP BY campaign_id ORDER BY t_revenue DESC`, { from, to })

  const shaped = rows.map((r) => ({
    campaign_id: int(r.campaign_id),
    name: r.t_name || `#${r.campaign_id}`,
    campaign_type: r.t_type,
    vertical: r.t_vertical || '(unmapped)',
    paused: Boolean(Number(r.t_paused)),
    leads: int(r.t_leads),
    accepted: int(r.t_accepted),
    failed: int(r.t_failed),
    returned: int(r.t_returned),
    accept_rate: pct(r.t_accepted, r.t_leads),
    cost: num(r.t_cost),
    revenue: num(r.t_revenue),
    profit: num(r.t_profit),
    margin: pct(r.t_profit, r.t_revenue),
  }))

  // Campaigns.jsx reads data.campaigns (it was written against
  // /summary); rows is included so either shape works.
  res.json({ range: { from, to }, campaigns: shaped, rows: shaped })
}))

/**
 * GET /api/verticals -- comparison table.
 */
finance.get('/verticals', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)

  const rows = await query(`
    SELECT vertical,
           sum(leads_total)    AS t_leads,
           sum(accepted_count) AS t_accepted,
           sum(cost)           AS t_cost,
           sum(revenue)        AS t_revenue,
           sum(profit)         AS t_profit
    FROM hs_daily_rollup
    WHERE day BETWEEN {from:Date} AND {to:Date}
    GROUP BY vertical ORDER BY t_revenue DESC`, { from, to })

  res.json({
    range: { from, to },
    rows: rows.map((r) => ({
      // Blank means the campaign is missing from hs_campaign_vertical.
      // Shown rather than hidden, so a missing mapping is visible
      // instead of quietly under-reporting every other vertical.
      vertical: r.vertical || '(unmapped)',
      leads: int(r.t_leads),
      accepted: int(r.t_accepted),
      accept_rate: pct(r.t_accepted, r.t_leads),
      cost: num(r.t_cost),
      revenue: num(r.t_revenue),
      profit: num(r.t_profit),
      margin: pct(r.t_profit, r.t_revenue),
      avg_rpl: Number(r.t_leads) ? num(Number(r.t_revenue) / Number(r.t_leads)) : 0,
    })),
  })
}))

/**
 * GET /api/accounting -- the finance view.
 *
 * Built from our own rollups rather than lp_accounting, because the UI
 * filters by an arbitrary date range while LeadProsper's figures are
 * netted inside one fixed window and cannot be sliced. lp_accounting
 * remains the invoice cross-check.
 */
finance.get('/accounting', asyncRoute(async (req, res) => {
  const { from, to } = dateRange(req.query)
  const params = { from, to }

  const owed = await query(`
    SELECT
      any(s.cid)               AS client_id,
      any(s.cname)             AS t_name,
      sum(r.leads_total)       AS t_leads,
      sum(r.accepted_count)    AS t_accepted,
      sum(r.returned_count)    AS t_returned,
      sum(r.cost)              AS t_amount,
      uniqExact(r.campaign_id) AS t_campaigns
    FROM hs_daily_rollup r
    LEFT JOIN ${SUPPLIER_CLIENT} s USING (supplier_id)
    WHERE r.day BETWEEN {from:Date} AND {to:Date}
    GROUP BY s.cid ORDER BY t_amount DESC`, params)

  const due = await query(`
    SELECT
      any(b.cid)               AS client_id,
      any(b.cname)             AS t_name,
      sum(r.pings_total)       AS t_leads,
      sum(r.accepted_count)    AS t_accepted,
      sum(r.returned_count)    AS t_returned,
      sum(r.revenue)           AS t_amount,
      uniqExact(r.campaign_id) AS t_campaigns
    FROM hs_supplier_buyer_rollup r
    LEFT JOIN ${BUYER_CLIENT} b USING (buyer_id)
    WHERE r.day BETWEEN {from:Date} AND {to:Date}
    GROUP BY b.cid ORDER BY t_amount DESC`, params)

  const shape = (r) => ({
    client_id: int(r.client_id),
    name: r.t_name || `#${r.client_id}`,
    leads: int(r.t_leads),
    // What actually gets invoiced: accepted minus returns.
    net_leads: int(r.t_accepted) - int(r.t_returned),
    returned_leads: int(r.t_returned),
    campaigns: int(r.t_campaigns),
    amount: num(r.t_amount),
  })

  const owedRows = owed.map(shape)
  const dueRows = due.map(shape)
  const total = (rows) => num(rows.reduce((n, r) => n + r.amount, 0))

  res.json({
    range: { from, to },
    owed: { rows: owedRows, total: total(owedRows) },
    due: { rows: dueRows, total: total(dueRows) },
  })
}))

/**
 * GET  /api/adjustments?entity_type=&entity_id=  -- history
 * POST /api/adjustments                          -- new correction
 *
 * The only mutation in the system. Insert-only: an edit is a new row,
 * never an update, and a mistake is superseded by a revoking row.
 */
finance.get('/adjustments', asyncRoute(async (req, res) => {
  const { entity_type, entity_id } = req.query

  const clauses = []
  const params = {}
  if (entity_type) { clauses.push('entity_type = {entity_type:String}'); params.entity_type = entity_type }
  if (entity_id) { clauses.push('entity_id = {entity_id:UInt64}'); params.entity_id = Number(entity_id) }

  const rows = await query(`
    SELECT adjustment_id, entity_type, entity_id, field, value,
           period_start, period_end, created_by, created_at, revoked
    FROM hs_adjustments
    ${clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''}
    ORDER BY created_at DESC LIMIT 500`, params)

  res.json({ rows })
}))

const ADJUSTABLE = new Set(['cost_override', 'revenue_override', 'note'])

finance.post('/adjustments', asyncRoute(async (req, res) => {
  const { entity_type, entity_id, field, value, period_start, period_end, created_by } = req.body ?? {}

  const bad = (msg) => { const e = new Error(msg); e.status = 400; throw e }

  if (!['supplier', 'buyer'].includes(entity_type)) bad('entity_type must be supplier or buyer')
  if (!Number.isInteger(Number(entity_id)) || Number(entity_id) <= 0) bad('entity_id must be a positive integer')
  if (!ADJUSTABLE.has(field)) bad(`field must be one of: ${[...ADJUSTABLE].join(', ')}`)
  if (value == null || String(value) === '') bad('value is required')
  if (!created_by) bad('created_by is required')

  const { from, to } = dateRange({ from: period_start, to: period_end })

  // A money override must parse as money, or it silently becomes 0 when
  // read back and understates an invoice.
  if (field.endsWith('_override') && !Number.isFinite(Number(value))) {
    bad(`${field} must be numeric`)
  }

  const row = {
    adjustment_id: crypto.randomUUID(),
    entity_type,
    entity_id: Number(entity_id),
    field,
    value: String(value),
    period_start: from,
    period_end: to,
    created_by: String(created_by),
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    revoked: 0,
  }

  const { db } = await import('../db.js')
  await db.insert({ table: 'hs_adjustments', values: [row], format: 'JSONEachRow' })

  res.status(201).json({ ok: true, adjustment: row })
}))
