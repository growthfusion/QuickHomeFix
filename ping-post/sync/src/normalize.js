/**
 * Maps LeadProsper API payloads onto the ClickHouse schema.
 *
 * Kept apart from the client so the field mapping is testable against
 * captured fixtures without any network, and so a change in their
 * response shape touches exactly one file.
 */

const chDateTime = (v) => {
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) throw new Error(`invalid datetime: ${v}`)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

const chDate = (v) => {
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) throw new Error(`invalid date: ${v}`)
  return d.toISOString().slice(0, 10)
}

const money = (v) => {
  const n = typeof v === 'number' ? v : Number(v ?? 0)
  if (!Number.isFinite(n)) throw new Error(`invalid money value: ${v}`)
  return Math.round(n * 100) / 100
}

const str = (v) => (v == null ? '' : String(v))
const int = (v) => {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}
const bool = (v) => (v === true || v === 1 || v === '1' ? 1 : 0)

// Contact fields we promote to real columns. Everything else in
// lead_data stays in the Map, so a campaign adding a question never
// needs a migration.
const PROMOTED = new Set([
  'first_name', 'last_name', 'email', 'phone',
  'address', 'city', 'state', 'zip_code',
  // Compliance trail -- real columns, not Map entries. These are what
  // gets subpoenaed, and digging them out of a Map under legal pressure
  // is not when you want to discover they were dropped.
  // Names verified against a real /public/leads payload, which differs
  // from what the docs implied: landing_page_url, trustedform_cert_url,
  // and tcpa_text (the consent TEXT, not a boolean flag).
  'ip_address', 'landing_page_url', 'trustedform_cert_url',
  'jornaya_leadid', 'tcpa_text',
])

export function normalizeLead(raw, syncedAt = new Date(), vertical = '') {
  const ld = raw.lead_data ?? {}

  const cost = money(raw.cost)
  const revenue = money(raw.revenue)

  // lead_date_ms arrives as a string of epoch milliseconds.
  const receivedAt = chDateTime(new Date(Number(raw.lead_date_ms)))

  // Whatever is not promoted goes to the Map. ClickHouse Map values are
  // Strings, so everything is stringified here rather than at insert.
  const extra = {}
  for (const [k, v] of Object.entries(ld)) {
    if (PROMOTED.has(k)) continue
    extra[k] = v == null ? '' : String(v)
  }

  return {
    lead_id: str(raw.id),
    received_at: receivedAt,
    campaign_id: int(raw.campaign_id),
    campaign_name: str(raw.campaign_name),
    vertical: str(vertical),

    status: str(raw.status),
    error_code: int(raw.error_code),
    error_message: str(raw.error_message),

    validation_error_provider: str(raw.validation_error_provider),
    validation_error_description: str(raw.validation_error_description),

    returned: bool(raw.returned),
    return_reason: str(raw.return_reason),

    is_test: bool(raw.test),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],

    supplier_id: int(raw.supplier?.id),
    supplier_name: str(raw.supplier?.name),
    supplier_client_id: int(raw.supplier?.client?.id),

    cost,
    revenue,
    // Computed once at sync so every consumer agrees. Negative when a
    // lead cost us but did not sell -- which is exactly the loss the
    // dashboard exists to surface.
    profit: money(revenue - cost),

    first_name: str(ld.first_name),
    last_name: str(ld.last_name),
    email: str(ld.email),
    phone: str(ld.phone),
    address: str(ld.address),
    city: str(ld.city),
    state: str(ld.state),
    zip_code: str(ld.zip_code),

    ip_address: str(ld.ip_address),
    landing_page: str(ld.landing_page_url),
    trusted_form: str(ld.trustedform_cert_url),
    jornaya_leadid: str(ld.jornaya_leadid),
    // The API returns consent TEXT, not a flag. Non-empty text is the
    // consent record, so presence is the boolean.
    tcpa_consent: ld.tcpa_text ? 1 : 0,

    lead_data: extra,

    synced_at: chDateTime(syncedAt),
  }
}

/**
 * Explodes a lead's buyers array into one row each.
 *
 * A ping-post lead is offered to several buyers and bought by at most
 * one, so this is where the difference between "pinged" and "sold"
 * lives. Flattening it into the lead row would lose that entirely.
 */
export function normalizeLeadBuyers(raw, syncedAt = new Date(), vertical = '') {
  const receivedAt = chDateTime(new Date(Number(raw.lead_date_ms)))
  const at = chDateTime(syncedAt)
  const ld = raw.lead_data ?? {}

  return (raw.buyers ?? []).map((b) => ({
    lead_id: str(raw.id),
    buyer_id: int(b.id),
    buyer_name: str(b.name),
    buyer_client_id: int(b.client?.id),

    status: str(b.status),
    error_code: int(b.error_code),
    error_message: str(b.error_message),

    sell_price: money(b.sell_price),
    returned: bool(b.returned),
    return_reason: str(b.return_reason),

    received_at: receivedAt,
    campaign_id: int(raw.campaign_id),
    supplier_id: int(raw.supplier?.id),
    vertical: str(vertical),
    // Denormalised from the lead, same as campaign_id/supplier_id above --
    // lets hs_buyer_geo_rollup group by zip without joining lp_leads.
    zip_code: str(ld.zip_code),
    state: str(ld.state),

    synced_at: at,
  }))
}

export function normalizeCampaign(raw, syncedAt = new Date(), vertical = '') {
  return {
    campaign_id: int(raw.id),
    name: str(raw.name),
    public_name: str(raw.public_name),
    campaign_type: str(raw.campaign_type),
    vertical: str(vertical),
    paused: bool(raw.paused),
    synced_at: chDateTime(syncedAt),
  }
}

/** Suppliers and buyers arrive nested inside each campaign. */
export function normalizeSuppliers(campaign, syncedAt = new Date()) {
  const at = chDateTime(syncedAt)
  return (campaign.suppliers ?? []).map((s) => ({
    supplier_id: int(s.id),
    campaign_id: int(campaign.id),
    client_id: int(s.client_id),
    client_name: str(s.client_name),
    nickname: str(s.nickname),
    paused: bool(s.paused),
    test_mode: bool(s.test_mode),
    // Not exposed by LeadProsper -- kept blank here and maintained via
    // hs_adjustments rather than invented at sync time.
    account_manager: '',
    synced_at: at,
  }))
}

export function normalizeBuyers(campaign, syncedAt = new Date()) {
  const at = chDateTime(syncedAt)
  return (campaign.buyers ?? []).map((b) => ({
    buyer_id: int(b.id),
    campaign_id: int(campaign.id),
    client_id: int(b.client_id),
    client_name: str(b.client_name),
    nickname: str(b.nickname),
    paused: bool(b.paused),
    real_time_delivery_type: str(b.real_time_delivery_type),
    // null, not 0: LeadProsper omits the cap for uncapped buyers, and
    // 0 would read as "capped at zero" -- the opposite of the truth.
    cap_daily: b.cap_daily == null ? null : int(b.cap_daily),
    synced_at: at,
  }))
}

export function normalizeClient(raw, syncedAt = new Date()) {
  return {
    client_id: int(raw.id),
    company: str(raw.company),
    full_name: str(raw.full_name),
    email: str(raw.email),
    phone: str(raw.phone),
    synced_at: chDateTime(syncedAt),
  }
}

/**
 * Flattens one accounting client into per-campaign rows.
 *
 * `owed` is what we pay them (they supplied leads); `due` is what they
 * pay us (they bought leads). A client can appear in both.
 */
export function normalizeAccounting(entry, { startDate, endDate }, syncedAt = new Date()) {
  const at = chDateTime(syncedAt)
  const client = entry.client ?? {}
  const rows = []

  for (const direction of ['owed', 'due']) {
    for (const b of entry[direction]?.breakdown ?? []) {
      rows.push({
        period_start: chDate(startDate),
        period_end: chDate(endDate),
        client_id: int(client.id),
        company: str(client.company),
        direction,
        campaign_id: int(b.campaign_id),
        campaign_name: str(b.campaign_name),
        quantity: int(b.quantity),
        total_amount: money(b.total_amount),
        returned_leads: int(b.returned_leads),
        returned_amount: money(b.returned_amount),
        net_leads: int(b.net_leads),
        net_amount: money(b.net_amount),
        avg_price: Math.round(Number(b.avg_price ?? 0) * 10000) / 10000,
        synced_at: at,
      })
    }
  }

  return rows
}

export { chDate, chDateTime, money }
