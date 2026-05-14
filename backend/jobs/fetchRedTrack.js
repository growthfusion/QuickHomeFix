import axios from 'axios';
import { createClient } from '@clickhouse/client';

const RT_BASE = 'https://api.redtrack.io';

// Only pull data for these 7 QHF traffic channel IDs
const QHF_SOURCE_IDS = new Set([
  '6973b115cf6f4f9efdaec963',
  '69e726d9a4d9b51357c6304d',
  '69e7279a3bab5180c00c1ac8',
  '69e7279e0a796ad2584aef8e',
  '69e8a55e37d74edb736a4d31',
  '69e8a5bb558d8330b45fddf1',
  '69e8a614a9384a9ddbbb4aaf',
]);

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
  const date_to = now.toISOString().slice(0, 10);
  const date_from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { date_from, date_to };
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
    const { date_from, date_to } = last30Days();

    let res;
    try {
      res = await axios.get(`${RT_BASE}/report`, {
        params: {
          api_key: apiKey,
          date_from,
          date_to,
          'group[]': ['date', 'source', 'campaign', 'landing'],
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

    const filtered = data.filter(r => QHF_SOURCE_IDS.has(String(r.source_id || '')));

    if (filtered.length === 0) {
      console.log('[fetchRedTrack] No rows matched QHF source IDs');
      return;
    }

    const rows = filtered.map(r => ({
      fetched_at: fetchedAt,
      date: r.date || date_from,
      campaign_id: String(r.campaign_id || ''),
      campaign_name: r.campaign_name || '',
      landing: r.landing || '',
      lp_views: Number(r.lp_views || 0),
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
