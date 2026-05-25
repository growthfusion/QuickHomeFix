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
    console.log(`[fetchLeadProsper] Inserted ${allRows.length} rows across ${days.length} days`);

    if (allBuyerRows.length > 0) {
      await ch.insert({ table: 'leadprosper_buyer_stats', values: allBuyerRows, format: 'JSONEachRow' });
      console.log(`[fetchLeadProsper] Inserted ${allBuyerRows.length} buyer rows`);
    }
    await ch.command({ query: `ALTER TABLE leadprosper_buyer_stats DELETE WHERE fetched_at != '${fetchedAt}'` });
  } finally {
    await ch.close();
  }
}
