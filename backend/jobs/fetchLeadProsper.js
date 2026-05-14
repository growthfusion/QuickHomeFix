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
      }
    }

    if (allRows.length === 0) {
      console.log('[fetchLeadProsper] No stats returned for any day this month');
      return;
    }

    await ch.insert({ table: 'leadprosper_stats', values: allRows, format: 'JSONEachRow' });
    console.log(`[fetchLeadProsper] Inserted ${allRows.length} rows across ${days.length} days`);
  } finally {
    await ch.close();
  }
}
