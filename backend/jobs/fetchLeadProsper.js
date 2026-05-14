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

function currentMonthRange() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const start = `${yyyy}-${mm}-01`;
  const end = now.toISOString().slice(0, 10);
  return { start_date: start, end_date: end };
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
    const date = new Date().toISOString().slice(0, 10);
    const dateRange = currentMonthRange();

    let statsRes, accountingRes;
    try {
      [statsRes, accountingRes] = await Promise.all([
        axios.get(`${LP_BASE}/public/stats`, { headers, params: dateRange }),
        axios.get(`${LP_BASE}/public/accounting`, {
          headers,
          params: { ...dateRange, client_type: 'buyers', mode: 'granular' },
        }),
      ]);
    } catch (err) {
      console.error('[fetchLeadProsper] API call failed:', err.message);
      return;
    }

    const stats = Array.isArray(statsRes.data) ? statsRes.data : [];
    const accounting = Array.isArray(accountingRes.data) ? accountingRes.data : [];

    if (stats.length === 0) {
      console.log('[fetchLeadProsper] No stats returned');
      return;
    }

    const acctMap = {};
    accounting.forEach(a => { acctMap[a.campaign_id] = a; });

    const rows = stats.map(s => {
      const acct = acctMap[s.id] || {};
      return {
        fetched_at: fetchedAt,
        date,
        campaign_id: String(s.id || ''),
        campaign_name: s.name || '',
        leads_total: Number(s.leads_total || 0),
        leads_accepted: Number(s.leads_accepted || 0),
        leads_failed: Number(s.leads_failed || 0),
        leads_returned: Number(s.leads_returned || 0),
        total_buy: Number(acct.total_buy || 0),
        total_sell: Number(acct.total_sell || 0),
        net_profit: Number(acct.net_profit || 0),
      };
    });

    await ch.insert({ table: 'leadprosper_stats', values: rows, format: 'JSONEachRow' });
    console.log(`[fetchLeadProsper] Inserted ${rows.length} rows`);
  } finally {
    await ch.close();
  }
}
