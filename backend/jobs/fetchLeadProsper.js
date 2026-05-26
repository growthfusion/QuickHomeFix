import axios from 'axios';
import { createClient } from '@clickhouse/client';

const LP_BASE = 'https://api.leadprosper.io';

function buildClient() {
  const host = process.env.CLICKHOUSE_HOST || '';
  const url = /^https?:\/\//i.test(host)
    ? host
    : `https://${host}:${process.env.CLICKHOUSE_PORT || 8443}`;
  return createClient({
    url,
    database: process.env.CLICKHOUSE_DATABASE || 'default',
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    request_timeout: 45000,
  });
}

function currentMonthDays() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const days = [];
  for (let d = 1; d <= now.getDate(); d++) {
    const dd = String(d).padStart(2, '0');
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
}

async function fetchDay(headers, day) {
  const params = { start_date: day, end_date: day };
  const [statsRes, accountingRes] = await Promise.all([
    axios.get(`${LP_BASE}/public/stats`, { headers, params }),
    axios.get(`${LP_BASE}/public/accounting`, {
      headers,
      params: { ...params, client_type: 'buyers', mode: 'granular' },
    }),
  ]);
  return {
    day,
    stats: Array.isArray(statsRes.data) ? statsRes.data : [],
    accounting: Array.isArray(accountingRes.data) ? accountingRes.data : [],
  };
}

async function fetchAllLeadsForCampaign(headers, campaignId, startDate, endDate) {
  const allLeads = [];
  let searchAfter = null;
  do {
    const params = { start_date: startDate, end_date: endDate, campaign: campaignId };
    if (searchAfter) params.search_after = searchAfter;
    const res = await axios.get(`${LP_BASE}/public/leads`, { headers, params });
    const batch = Array.isArray(res.data?.leads) ? res.data.leads : [];
    allLeads.push(...batch);
    searchAfter = res.data?.search_after || null;
  } while (searchAfter);
  return allLeads;
}

export async function fetchLeadProsper() {
  const key = process.env.LEADPROSPER_API_KEY;

  if (!key) {
    console.warn('[fetchLeadProsper] LEADPROSPER_API_KEY not set — skipping');
    return;
  }

  const headers = { Authorization: `Bearer ${key}` };
  const ch = buildClient();
  try {
    const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const days = currentMonthDays();

    const settled = await Promise.allSettled(days.map(day => fetchDay(headers, day)));

    const dayResults = settled.map((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`[fetchLeadProsper] Failed to fetch ${days[i]}:`, r.reason?.message);
        return null;
      }
      return r.value;
    }).filter(Boolean);

    if (dayResults.length === 0) {
      console.error('[fetchLeadProsper] All daily API calls failed');
      return;
    }

    const allRows = [];
    const allBuyerRows = [];

    for (const { day, stats, accounting } of dayResults) {
      if (stats.length === 0) continue;
      const acctMap = {};
      accounting.forEach(a => { acctMap[a.campaign_id] = a; });
      for (const s of stats) {
        const c = s.campaign || s;
        const acct = acctMap[c.id] || {};
        allRows.push({
          fetched_at: fetchedAt,
          date: day,
          campaign_id: String(c.id || ''),
          campaign_name: c.name || '',
          leads_total: Number(c.leads_total || 0),
          leads_accepted: Number(c.leads_accepted || 0),
          leads_failed: Number(c.leads_failed || 0),
          leads_returned: Number(c.leads_returned || 0),
          total_buy: Number(acct.total_buy || 0),
          total_sell: Number(acct.total_sell || 0),
          net_profit: Number(acct.net_profit || 0),
        });

        const buyers = Array.isArray(s.buyers) ? s.buyers : [];
        for (const b of buyers) {
          allBuyerRows.push({
            fetched_at: fetchedAt,
            date: day,
            campaign_id: String(c.id || ''),
            campaign_name: c.name || '',
            buyer_id: String(b.id || ''),
            buyer_name: b.name || '',
            leads_total: Number(b.leads_total || 0),
            leads_accepted: Number(b.leads_accepted || 0),
            leads_duplicated: Number(b.leads_duplicated || 0),
            leads_failed: Number(b.leads_failed || 0),
            leads_returned: Number(b.leads_returned || 0),
            pings_total: Number(b.pings_total || 0),
            pings_accepted: Number(b.pings_accepted || 0),
            pings_failed: Number(b.pings_failed || 0),
            total_sell: Number(b.total_sell || 0),
            gross_revenue: Number(b.gross_revenue || 0),
            net_revenue: Number(b.net_revenue || 0),
            returned_revenue: Number(b.returned_revenue || 0),
            net_leads_accepted: Number(b.net_leads_accepted || 0),
            ping_accept_rate: Number(b.pings_total || 0) > 0
              ? +((Number(b.pings_accepted || 0) / Number(b.pings_total)) * 100).toFixed(2) : 0,
            ping_reject_rate: Number(b.pings_total || 0) > 0
              ? +((Number(b.pings_failed || 0) / Number(b.pings_total)) * 100).toFixed(2) : 0,
          });
        }
      }
    }

    if (allRows.length === 0) {
      console.log('[fetchLeadProsper] No stats returned for any day this month');
      return;
    }

    await ch.insert({ table: 'leadprosper_stats', values: allRows, format: 'JSONEachRow' });
    await ch.command({ query: `ALTER TABLE leadprosper_stats DELETE WHERE fetched_at != '${fetchedAt}'` });
    console.log(`[fetchLeadProsper] Inserted ${allRows.length} stats rows`);

    if (allBuyerRows.length > 0) {
      await ch.insert({ table: 'leadprosper_buyer_stats', values: allBuyerRows, format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_buyer_stats DELETE WHERE fetched_at != '${fetchedAt}'` });
    }

    // Leads fetch — one paginated call per campaign found in stats
    const campaignIds = [...new Set(
      dayResults.flatMap(({ stats }) => stats.map(s => String((s.campaign || s).id || '')))
    )].filter(Boolean);

    const allLeads = [];
    for (const cid of campaignIds) {
      try {
        const leads = await fetchAllLeadsForCampaign(headers, cid, days[0], days[days.length - 1]);
        allLeads.push(...leads);
      } catch (e) {
        console.warn(`[fetchLeadProsper] leads fetch failed for campaign ${cid}:`, e.message);
      }
    }

    if (allLeads.length > 0) {
      const allLeadRecordRows  = buildLeadRecordRows(fetchedAt, allLeads);
      // Use only the latest day's buyer rows for ping aggregation — LP stats returns
      // cumulative MTD totals per day, so summing all days would double-count pings.
      const latestDay          = days[days.length - 1];
      const latestBuyerRows    = allBuyerRows.filter(r => r.date === latestDay);
      const aggBuyerRows       = computeAggBuyer(fetchedAt, allLeadRecordRows, latestBuyerRows);
      const aggStateRows       = computeAggBuyerState(fetchedAt, allLeadRecordRows);
      const aggCityRows        = computeAggBuyerStateCity(fetchedAt, allLeadRecordRows);
      const aggPostalRows      = computeAggBuyerPostal(fetchedAt, allLeadRecordRows);

      await ch.insert({ table: 'leadprosper_lead_records',    values: allLeadRecordRows, format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_lead_records    DELETE WHERE fetched_at != '${fetchedAt}'` });

      await ch.insert({ table: 'leadprosper_agg_buyer',        values: aggBuyerRows,      format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_agg_buyer        DELETE WHERE fetched_at != '${fetchedAt}'` });

      await ch.insert({ table: 'leadprosper_agg_buyer_state',  values: aggStateRows,      format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_agg_buyer_state  DELETE WHERE fetched_at != '${fetchedAt}'` });

      await ch.insert({ table: 'leadprosper_agg_buyer_city',   values: aggCityRows,       format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_agg_buyer_city   DELETE WHERE fetched_at != '${fetchedAt}'` });

      await ch.insert({ table: 'leadprosper_agg_buyer_postal', values: aggPostalRows,     format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_agg_buyer_postal DELETE WHERE fetched_at != '${fetchedAt}'` });

      console.log(`[fetchLeadProsper] Inserted ${allLeadRecordRows.length} lead records across ${campaignIds.length} campaigns`);
    }
  } finally {
    await ch.close();
  }
}

// ── Pure data-transformation functions (exported for unit testing) ────────────

export function buildLeadRecordRows(fetchedAt, leads) {
  const rows = [];
  for (const lead of leads) {
    const ld = lead.lead_data || {};
    const base = {
      fetched_at:    fetchedAt,
      lead_id:       String(lead.id || ''),
      lead_date:     new Date(Number(lead.lead_date_ms)).toISOString().slice(0, 10),
      campaign_id:   String(lead.campaign_id || ''),
      campaign_name: String(lead.campaign_name || ''),
      lead_status:   String(lead.status || ''),
      revenue:       Number(lead.revenue || 0),
      state:         String(ld.state || ''),
      city:          String(ld.city || ''),
      postal_code:   String(ld.postalCode || ''),
      service:       String(ld.service || ''),
      rt_ad:         String(ld.rt_ad || ''),
      source_id:     String(ld.source_id || ''),
      supplier_id:   String(lead.supplier?.id || ''),
      supplier_name: String(lead.supplier?.name || ''),
    };
    for (const b of (Array.isArray(lead.buyers) ? lead.buyers : [])) {
      rows.push({
        ...base,
        buyer_id:      String(b.id || ''),
        buyer_name:    String(b.name || ''),
        buyer_status:  String(b.status || ''),
        sell_price:    Number(b.sell_price || 0),
        error_code:    Number(b.error_code || 0),
        error_message: String(b.error_message || ''),
      });
    }
  }
  return rows;
}

export function computeAggBuyer(fetchedAt, leadRecordRows, allBuyerRows) {
  const map = new Map();
  for (const r of leadRecordRows) {
    if (!map.has(r.buyer_id)) map.set(r.buyer_id, {
      buyer_id: r.buyer_id, buyer_name: r.buyer_name,
      total_leads: 0, accepted_leads: 0, rejected_leads: 0,
      outbid_leads: 0, sold_leads: 0, total_revenue: 0,
    });
    const v = map.get(r.buyer_id);
    v.total_leads++;
    if (r.buyer_status === 'ACCEPTED') { v.accepted_leads++; v.sold_leads++; v.total_revenue += r.sell_price; }
    else if (r.buyer_status === 'ERROR')  { v.rejected_leads++; }
    else if (r.buyer_status === 'OUTBID') { v.outbid_leads++; }
  }
  const pingMap = new Map();
  for (const r of allBuyerRows) {
    if (!pingMap.has(r.buyer_id)) pingMap.set(r.buyer_id, { pings_total: 0, pings_accepted: 0, pings_failed: 0 });
    const p = pingMap.get(r.buyer_id);
    p.pings_total    += Number(r.pings_total    || 0);
    p.pings_accepted += Number(r.pings_accepted || 0);
    p.pings_failed   += Number(r.pings_failed   || 0);
  }
  return [...map.values()].map(v => {
    const p = pingMap.get(v.buyer_id) || { pings_total: 0, pings_accepted: 0, pings_failed: 0 };
    return {
      fetched_at:       fetchedAt,
      buyer_id:         v.buyer_id,
      buyer_name:       v.buyer_name,
      total_leads:      v.total_leads,
      accepted_leads:   v.accepted_leads,
      rejected_leads:   v.rejected_leads,
      outbid_leads:     v.outbid_leads,
      sold_leads:       v.sold_leads,
      total_revenue:    +v.total_revenue.toFixed(2),
      avg_sell_price:   v.sold_leads   > 0 ? +(v.total_revenue / v.sold_leads   * 1).toFixed(2) : 0,
      acceptance_rate:  v.total_leads  > 0 ? +(v.accepted_leads / v.total_leads  * 100).toFixed(2) : 0,
      rejection_rate:   v.total_leads  > 0 ? +(v.rejected_leads / v.total_leads  * 100).toFixed(2) : 0,
      conversion_rate:  v.total_leads  > 0 ? +(v.sold_leads     / v.total_leads  * 100).toFixed(2) : 0,
      pings_total:      p.pings_total,
      pings_accepted:   p.pings_accepted,
      pings_failed:     p.pings_failed,
      ping_accept_rate: p.pings_total > 0 ? +(p.pings_accepted / p.pings_total * 100).toFixed(2) : 0,
      ping_reject_rate: p.pings_total > 0 ? +(p.pings_failed   / p.pings_total * 100).toFixed(2) : 0,
    };
  });
}

function _aggMetrics(v) {
  return {
    total_leads:     v.total_leads,
    accepted_leads:  v.accepted_leads,
    rejected_leads:  v.rejected_leads,
    outbid_leads:    v.outbid_leads,
    sold_leads:      v.sold_leads,
    total_revenue:   +v.total_revenue.toFixed(2),
    avg_sell_price:  v.sold_leads  > 0 ? +(v.total_revenue / v.sold_leads  * 1).toFixed(2) : 0,
    acceptance_rate: v.total_leads > 0 ? +(v.accepted_leads / v.total_leads * 100).toFixed(2) : 0,
    rejection_rate:  v.total_leads > 0 ? +(v.rejected_leads / v.total_leads * 100).toFixed(2) : 0,
    conversion_rate: v.total_leads > 0 ? +(v.sold_leads     / v.total_leads * 100).toFixed(2) : 0,
  };
}

function _accumulateLead(map, key, dims, r) {
  if (!map.has(key)) map.set(key, { ...dims, total_leads: 0, accepted_leads: 0, rejected_leads: 0, outbid_leads: 0, sold_leads: 0, total_revenue: 0 });
  const v = map.get(key);
  v.total_leads++;
  if (r.buyer_status === 'ACCEPTED') { v.accepted_leads++; v.sold_leads++; v.total_revenue += r.sell_price; }
  else if (r.buyer_status === 'ERROR')  { v.rejected_leads++; }
  else if (r.buyer_status === 'OUTBID') { v.outbid_leads++; }
}

export function computeAggBuyerState(fetchedAt, leadRecordRows) {
  const map = new Map();
  for (const r of leadRecordRows) {
    const key = `${r.buyer_id}|${r.state}`;
    _accumulateLead(map, key, { buyer_id: r.buyer_id, buyer_name: r.buyer_name, state: r.state }, r);
  }
  return [...map.values()].map(v => ({ fetched_at: fetchedAt, buyer_id: v.buyer_id, buyer_name: v.buyer_name, state: v.state, ..._aggMetrics(v) }));
}

export function computeAggBuyerStateCity(fetchedAt, leadRecordRows) {
  const map = new Map();
  for (const r of leadRecordRows) {
    const key = `${r.buyer_id}|${r.state}|${r.city}`;
    _accumulateLead(map, key, { buyer_id: r.buyer_id, buyer_name: r.buyer_name, state: r.state, city: r.city }, r);
  }
  return [...map.values()].map(v => ({ fetched_at: fetchedAt, buyer_id: v.buyer_id, buyer_name: v.buyer_name, state: v.state, city: v.city, ..._aggMetrics(v) }));
}

export function computeAggBuyerPostal(fetchedAt, leadRecordRows) {
  const map = new Map();
  for (const r of leadRecordRows) {
    const key = `${r.buyer_id}|${r.postal_code}`;
    _accumulateLead(map, key, { buyer_id: r.buyer_id, buyer_name: r.buyer_name, postal_code: r.postal_code, state: r.state }, r);
  }
  return [...map.values()].map(v => ({ fetched_at: fetchedAt, buyer_id: v.buyer_id, buyer_name: v.buyer_name, postal_code: v.postal_code, state: v.state, ..._aggMetrics(v) }));
}
