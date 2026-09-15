import { db, insertBatched, query } from './clickhouse.js'
import { createLeadProsperClient } from './leadprosper/index.js'
import { rebuildRollups } from './rebuildRollups.js'
import {
  normalizeLead, normalizeLeadBuyers, normalizeCampaign,
  normalizeSuppliers, normalizeBuyers, normalizeClient,
  normalizeAccounting, chDate, chDateTime,
} from './normalize.js'

/**
 * One-directional sync: LeadProsper -> ClickHouse. Never writes back.
 *
 * Idempotency comes from the schema, not from this code:
 * lp_leads is a ReplacingMergeTree keyed on lead_id, so re-syncing an
 * overlapping window replaces rows instead of double-counting money.
 * That property is what makes it safe to re-run on failure, and it is
 * why a failed run can simply replay the whole window.
 */

async function readCheckpoint(stream) {
  const rows = await query(
    `SELECT last_synced_at, cursor
     FROM lp_sync_state FINAL
     WHERE stream = {stream:String}
     LIMIT 1`,
    { stream },
  )
  return rows[0] ?? null
}

async function writeCheckpoint(stream, lastSyncedAt, cursor, rowsWritten) {
  await db.insert({
    table: 'lp_sync_state',
    values: [{
      stream,
      last_synced_at: chDateTime(lastSyncedAt),
      cursor: cursor ?? '',
      rows_written: rowsWritten,
      updated_at: chDateTime(new Date()),
    }],
    format: 'JSONEachRow',
  })
}

/**
 * campaign_id -> vertical, from our own mapping table.
 *
 * LeadProsper has no vertical concept, so this is maintained by hand in
 * hs_campaign_vertical. An unmapped campaign yields '' rather than a
 * guess: a wrong vertical silently corrupts every rollup sliced by it,
 * while a blank one is visibly missing and easy to find.
 */
async function loadVerticals() {
  const rows = await query(
    'SELECT campaign_id, vertical FROM hs_campaign_vertical FINAL',
  )
  return new Map(rows.map((r) => [Number(r.campaign_id), r.vertical]))
}

/**
 * Dimensions are low-volume, so a full refresh each run is simpler and
 * cheaper than incremental logic. ReplacingMergeTree dedups on the id.
 *
 * Suppliers and buyers are NOT separate endpoints -- they arrive nested
 * inside each campaign, which is why this is one call and not three.
 */
async function syncDimensions(client, syncedAt, verticals, log) {
  const [campaigns, clients] = await Promise.all([
    client.fetchCampaigns(),
    client.fetchClients(),
  ])

  const suppliers = campaigns.flatMap((c) => normalizeSuppliers(c, syncedAt))
  const buyers = campaigns.flatMap((c) => normalizeBuyers(c, syncedAt))

  const written = {
    campaigns: await insertBatched(
      'lp_campaigns',
      campaigns.map((c) => normalizeCampaign(c, syncedAt, verticals.get(Number(c.id)) ?? '')),
    ),
    clients: await insertBatched(
      'lp_clients', clients.map((c) => normalizeClient(c, syncedAt))),
    suppliers: await insertBatched('lp_suppliers', suppliers),
    buyers: await insertBatched('lp_buyers', buyers),
  }

  for (const [stream, count] of Object.entries(written)) {
    await writeCheckpoint(stream, syncedAt, '', count)
  }

  log(`  dimensions: ${written.campaigns} campaigns, ${written.clients} clients, ` +
      `${written.suppliers} suppliers, ${written.buyers} buyers`)

  const unmapped = campaigns.filter((c) => !verticals.has(Number(c.id)))
  if (unmapped.length) {
    log(`  WARNING: ${unmapped.length} campaign(s) have no vertical mapped ` +
        `-- add them to hs_campaign_vertical or every vertical-sliced ` +
        `report will under-report`)
  }

  return campaigns
}

/**
 * Leads sync one campaign at a time, because GET /public/leads requires
 * a single campaign id. Each campaign therefore carries its own
 * watermark (`leads:33962`) and advances independently -- a campaign
 * that fails does not hold back the others.
 *
 * Each lead writes to TWO tables: lp_leads (one row) and lp_lead_buyers
 * (one row per buyer pinged). The second is where ping-post economics
 * live; without it "how many leads did Upyield send that Modernize
 * bought" is unanswerable.
 */
async function syncLeads(client, campaigns, syncedAt, verticals, log, { backfillDays = 180 } = {}) {
  let totalLeads = 0
  let totalPings = 0

  for (const campaign of campaigns) {
    const campaignId = Number(campaign.id)
    const stream = `leads:${campaignId}`
    const vertical = verticals.get(campaignId) ?? ''

    const checkpoint = await readCheckpoint(stream)
    let since = checkpoint?.last_synced_at ?? null
    if (!since) {
      const start = new Date(syncedAt)
      start.setUTCDate(start.getUTCDate() - backfillDays)
      since = chDateTime(start)
    }

    let cursor = null
    let campaignLeads = 0
    let latest = since

    do {
      const { leads, nextCursor } = await client.fetchLeads({
        campaignId,
        startDate: chDate(since),
        endDate: chDate(syncedAt),
        cursor,
      })
      if (leads.length === 0) break

      const leadRows = leads.map((l) => normalizeLead(l, syncedAt, vertical))
      const buyerRows = leads.flatMap((l) => normalizeLeadBuyers(l, syncedAt, vertical))

      campaignLeads += await insertBatched('lp_leads', leadRows)
      totalPings += await insertBatched('lp_lead_buyers', buyerRows)

      // Track the newest received_at seen, not "now" -- the watermark
      // must reflect the data, or a slow run would skip leads that
      // arrived while it was running.
      for (const row of leadRows) {
        if (row.received_at > latest) latest = row.received_at
      }

      cursor = nextCursor
    } while (cursor)

    // Written only after every page lands. A mid-campaign failure
    // replays that campaign's whole window next run -- which is correct
    // precisely because the insert is idempotent.
    await writeCheckpoint(stream, latest, '', campaignLeads)
    totalLeads += campaignLeads
  }

  log(`  leads: ${totalLeads} leads, ${totalPings} buyer pings across ${campaigns.length} campaign(s)`)
  return { totalLeads, totalPings }
}

/**
 * Accounting is what LeadProsper actually invoices on, with returns
 * already netted. Our own rollups cross-check it rather than replace it.
 *
 * Re-fetched in full each run for the trailing window rather than
 * incrementally: the API nets returns WITHIN the window, so a late
 * return changes an earlier day's figure. An incremental sync would
 * miss that and the invoice figures would drift.
 */
async function syncAccounting(client, syncedAt, log, { days = 90 } = {}) {
  const start = new Date(syncedAt)
  start.setUTCDate(start.getUTCDate() - days)

  const startDate = chDate(start)
  const endDate = chDate(syncedAt)

  const entries = await client.fetchAccounting({ startDate, endDate })
  const rows = entries.flatMap((e) => normalizeAccounting(e, { startDate, endDate }, syncedAt))

  const written = await insertBatched('lp_accounting', rows)
  await writeCheckpoint('accounting', syncedAt, '', written)

  log(`  accounting: ${written} rows for ${startDate}..${endDate}`)
  return written
}

export async function runSync({ log = console.log, backfillDays, accountingDays } = {}) {
  const startedAt = Date.now()
  const syncedAt = new Date()
  const client = createLeadProsperClient()

  log(`sync started (source: ${client.name})`)

  const verticals = await loadVerticals()
  const campaigns = await syncDimensions(client, syncedAt, verticals, log)
  const { totalLeads, totalPings } = await syncLeads(
    client, campaigns, syncedAt, verticals, log, { backfillDays },
  )
  const accountingRows = await syncAccounting(client, syncedAt, log, { days: accountingDays })

  // Rebuilt, not incrementally maintained. A materialized view fires
  // per INSERT and cannot see that lp_leads deduplicates, so a
  // re-synced window would add the same lead's money to the rollup
  // twice -- silently, and plausibly.
  await rebuildRollups({ log })

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
  log(`sync complete in ${seconds}s`)

  return { campaigns: campaigns.length, leads: totalLeads, pings: totalPings, accountingRows, seconds }
}
