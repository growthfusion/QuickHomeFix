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
  const date_to = now.toISOString().slice(0, 10);
  const date_from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { date_from, date_to };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch QHF-specific source IDs from the /sources endpoint.
// Falls back to the hardcoded list if the API call fails.
const QHF_SOURCE_IDS_FALLBACK = [
  '6973b115cf6f4f9efdaec963', // QuickHomeFix | Meta | Purchase
  '69d5f3af8c110c9036eb014e', // QHF Meta
  '69dd2c224aed14986dd1bde8', // QHF Snap
  '69e726d9a4d9b51357c6304d', // QuickHomeFix | Meta | Roof | Karigouda
  '69e7279a3bab5180c00c1ac8', // QuickHomeFix | Meta | Bath | Karigouda
  '69e7279e0a796ad2584aef8e', // QuickHomeFix | Meta | Windows | Karigouda
  '69e8a55e37d74edb736a4d31', // QuickHomeFix | Snap | Roof
  '69e8a5bb558d8330b45fddf1', // QuickHomeFix | Snap | Bath
  '69e8a614a9384a9ddbbb4aaf', // QuickHomeFix | Snap | Windows
  '6a06ebe3493e29d568fb16e8', // QuickHomeFix | Google | Roof
  '6a06ec25493e29d568fb25cc', // QuickHomeFix | Google | Bath
  '6a06ec3e65debd90096398d5', // QuickHomeFix | Google | windows
  '6a06ee1b5d73f05db6c5b040', // QuickHomeFix | Meta | Bath | Ankith
  '6a06ee1b36a33020ed173d89', // QuickHomeFix | Meta | Roof | Ankith
  '6a06ee2065debd900963ee10', // QuickHomeFix | Meta | Windows | Ankith
];

async function fetchQhfSourceIds(apiKey) {
  try {
    const res = await axios.get(`${RT_BASE}/sources?api_key=${encodeURIComponent(apiKey)}&per=500`);
    const rows = Array.isArray(res.data) ? res.data : [];
    const qhfIds = rows
      .filter(s => /quickhomefix|qhf/i.test(s.title || s.name || ''))
      .map(s => s.id)
      .filter(Boolean);
    if (qhfIds.length > 0) {
      console.log(`[fetchRedTrack] Found ${qhfIds.length} QHF sources from API`);
      return qhfIds;
    }
    console.warn('[fetchRedTrack] No QHF sources found via API — using fallback list');
    return QHF_SOURCE_IDS_FALLBACK;
  } catch (err) {
    console.warn('[fetchRedTrack] /sources call failed — using fallback list:', err.message);
    return QHF_SOURCE_IDS_FALLBACK;
  }
}

// Call the RT /report endpoint with correct parameter format.
// group: comma-separated e.g. 'date' or 'date,source'
// sourceIds: array of source ID strings to filter
async function fetchReport(apiKey, date_from, date_to, group, sourceIds) {
  try {
    const srcParam = sourceIds.join(',');
    const url = `${RT_BASE}/report?api_key=${encodeURIComponent(apiKey)}&date_from=${date_from}&date_to=${date_to}&group=${encodeURIComponent(group)}&source_id=${encodeURIComponent(srcParam)}`;
    console.log(`[fetchRedTrack] report URL (group=${group})`, url.replace(/api_key=[^&]+/, 'api_key=***'));
    const res = await axios.get(url);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn(`[fetchRedTrack] report call failed (group=${group}):`, err.message);
    return [];
  }
}

// ── Buyer config (keep in sync with frontend/dash/form_leads.html BUYERS const) ──
// To add a new buyer: add one entry here AND in the frontend BUYERS array.
const BUYERS = [
  { key: 'kg',      keywords: ['karigouda', 'kg'] },
  { key: 'ak',      keywords: ['ankith', 'ak', 'anki'] },
  { key: 'viknesh', keywords: ['viknesh', 'vk', 'vn', 'google'] },
];

function inferOwner(src, parts) {
  for (const b of BUYERS) {
    for (const kw of b.keywords) {
      if (kw.length <= 2) {
        if (parts.includes(kw)) return b.key;
      } else {
        if (src.includes(kw)) return b.key;
      }
    }
  }
  return 'unknown';
}

function parseSourceTitle(title) {
  const src   = (title || '').toLowerCase();
  const parts = src.split('|').map(p => p.trim());

  const platform = src.includes('google') ? 'google'
    : src.includes('meta') ? 'meta'
    : src.includes('snap') ? 'snap'
    : '';

  const service = src.includes('bath') || src.includes('shower') || src.includes('tub') ? 'bath'
    : src.includes('roof') ? 'roof'
    : src.includes('window') || src.includes('windo') ? 'windo'
    : src.includes('gutter') ? 'gutters'
    : src.includes('solar') ? 'solar'
    : '';

  const owner = inferOwner(src, parts);

  return { platform, service, owner };
}

function makeRow(fetchedAt, type, row) {
  const sourceTitle = row.source || '';
  const { platform: rt_platform, service: rt_service, owner: rt_owner } = parseSourceTitle(sourceTitle);

  const lp_views  = Number(row.lp_views)  || 0;
  const lp_clicks = Number(row.lp_clicks) || 0;
  const lp_ctr    = lp_views > 0 ? (lp_clicks / lp_views) * 100 : 0;

  return {
    fetched_at:     fetchedAt,
    date:           row.date || '',
    breakdown_type: type,
    group_key:      type === 'daily' ? '' : sourceTitle,
    campaign_name:  '',
    adset_name:     '',
    ad_name:        '',
    channel:        sourceTitle,
    lander_name:    '',
    lp_views,
    lp_clicks,
    lp_ctr,
    conversions:    Number(row.conversions) || 0,
    purchases:      Number(row.purchases)   || 0,
    revenue:        Number(row.revenue)     || 0,
    cost:           Number(row.cost)        || 0,
    roi:            Number(row.roi)         || 0,
    device:         '',
    os:             '',
    region:         '',
    rt_platform,
    rt_service,
    rt_owner,
  };
}

export async function fetchRedTrack() {
  const apiKey = process.env.REDTRACK_API_KEY;
  if (!apiKey) {
    console.warn('[fetchRedTrack] REDTRACK_API_KEY not set — skipping');
    return;
  }

  const delayMs = Number(process.env.RT_CALL_DELAY_MS || 800);
  const { date_from, date_to } = last30Days();
  const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const ch = buildClient();

  try {
    // Step 1: get QHF source IDs
    const sourceIds = await fetchQhfSourceIds(apiKey);
    await delay(delayMs);

    // Step 2: fetch QHF daily totals (group=date)
    const dailyRows = await fetchReport(apiKey, date_from, date_to, 'date', sourceIds);
    console.log(`[fetchRedTrack] daily: ${dailyRows.length} rows`);
    await delay(delayMs);

    // Step 3: fetch QHF per-source breakdown (group=date,source)
    const sourceRows = await fetchReport(apiKey, date_from, date_to, 'date,source', sourceIds);
    console.log(`[fetchRedTrack] source: ${sourceRows.length} rows`);

    const allRows = [];

    for (const row of dailyRows) {
      if (!row.date) continue;
      allRows.push(makeRow(fetchedAt, 'daily', row));
    }

    for (const row of sourceRows) {
      if (!row.date) continue;
      allRows.push(makeRow(fetchedAt, 'source', row));
    }

    if (allRows.length === 0) {
      console.warn('[fetchRedTrack] No rows to insert — skipping');
      return;
    }

    // Truncate before insert so each scheduled run replaces all data (no duplicate accumulation).
    await ch.command({ query: 'TRUNCATE TABLE redtrack_stats' });
    await ch.insert({ table: 'redtrack_stats', values: allRows, format: 'JSONEachRow' });
    console.log(`[fetchRedTrack] Inserted ${allRows.length} rows (${dailyRows.length} daily + ${sourceRows.length} source)`);
  } finally {
    await ch.close();
  }
}
