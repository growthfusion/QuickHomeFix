import axios from 'axios';
import { createClient } from '@clickhouse/client';

const RT_BASE = 'https://api.redtrack.io';

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




function last30Days() {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from, to };
}

export async function fetchRedTrack() {
  const apiKey = process.env.REDTRACK_API_KEY;

  if (!apiKey) {
    console.warn('[fetchRedTrack] REDTRACK_API_KEY not set — skipping');
    return;
  }

  const ch = buildClient();
  try {
    const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const { from, to } = last30Days();

    let res;
    try {
      res = await axios.get(`${RT_BASE}/report`, {
        params: {
          api_key: apiKey,
          from,
          to,
          'group[]': ['date', 'campaign', 'landing'],
        },
      });
    } catch (err) {
      console.error('[fetchRedTrack] API call failed:', err.message);
      return;
    }

    const data = Array.isArray(res.data) ? res.data : [];
    if (data.length === 0) {
      console.log('[fetchRedTrack] No data returned');
      return;
    }

    const rows = data.map(r => ({
      fetched_at: fetchedAt,
      date: r.date || from,
      campaign_id: String(r.campaign_id || ''),
      campaign_name: r.campaign_name || '',
      landing: r.landing || '',
      clicks: Number(r.clicks || 0),
      conversions: Number(r.conversions || 0),
      revenue: Number(r.revenue || 0),
      cost: Number(r.cost || 0),
      epc: Number(r.epc || 0),
      roi: Number(r.roi || 0),
    }));

    await ch.insert({ table: 'redtrack_stats', values: rows, format: 'JSONEachRow' });
    console.log(`[fetchRedTrack] Inserted ${rows.length} rows`);
  } finally {
    await ch.close();
  }
}
