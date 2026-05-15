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

// Returns map: source_id → { channel_name, lander_name }
async function fetchTrafficSources(apiKey) {
  try {
    const res = await axios.get(`${RT_BASE}/traffic_sources?api_key=${encodeURIComponent(apiKey)}&limit=200`);
    const rows = Array.isArray(res.data) ? res.data : [];
    const sourceMap = {};
    for (const row of rows) {
      if (row.id) {
        sourceMap[String(row.id)] = {
          channel_name: row.name || row.title || '',
          lander_name:  row.lander?.name || row.offer?.name || row.landing?.name || '',
        };
      }
    }
    return sourceMap;
  } catch (err) {
    console.warn('[fetchRedTrack] traffic_sources call failed:', err.message);
    return {};
  }
}

function buildReportUrl(apiKey, date_from, date_to, groups) {
  const base = `${RT_BASE}/report?api_key=${encodeURIComponent(apiKey)}&date_from=${date_from}&date_to=${date_to}`;
  const groupParams = groups.map(g => `group[]=${encodeURIComponent(g)}`).join('&');
  return `${base}&${groupParams}`;
}

async function fetchReport(apiKey, date_from, date_to, groups) {
  try {
    const res = await axios.get(buildReportUrl(apiKey, date_from, date_to, groups));
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn(`[fetchRedTrack] report call failed (groups=${groups.join(',')}):`, err.message);
    return [];
  }
}

function deriveGroupKey(type, row) {
  switch (type) {
    case 'daily':    return '';
    case 'os':       return row.os       || row.os_family    || '';
    case 'device':   return row.device   || row.device_type  || '';
    case 'region':   return row.country  || row.country_name || row.region || '';
    case 'campaign': return row.campaign || row.campaign_name || row.name  || row.title || '';
    case 'lander':   return row.offer    || row.offer_name   || row.lander || '';
    case 'adset':    return row.adset    || row.adset_name   || '';
    case 'ad':       return row.ad       || row.ad_name      || '';
    default:         return '';
  }
}

function makeRow(fetchedAt, type, sourceMap, row) {
  let groupKey = deriveGroupKey(type, row);
  if (!groupKey && type !== 'daily') {
    console.warn(`[fetchRedTrack] empty group_key for type=${type}, storing as 'unknown'`);
    groupKey = 'unknown';
  }

  const lp_views  = Number(row.lp_views)   || 0;
  const lp_clicks = Number(row.lp_clicks)  || Number(row.landing_clicks) || 0;
  const lp_ctr    = lp_views > 0 ? (lp_clicks / lp_views) * 100 : 0;

  const src = sourceMap[String(row.source_id || '')] || {};

  return {
    fetched_at:     fetchedAt,
    date:           row.date,
    breakdown_type: type,
    group_key:      groupKey,
    campaign_name:  row.campaign      || row.campaign_name || row.name  || row.title || '',
    adset_name:     row.adset         || row.adset_name    || '',
    ad_name:        row.ad            || row.ad_name       || '',
    channel:        src.channel_name  || '',
    lander_name:    src.lander_name   || '',
    lp_views,
    lp_clicks,
    lp_ctr,
    conversions:    Number(row.conversions) || 0,
    purchases:      Number(row.purchases)   || 0,
    revenue:        Number(row.revenue)     || 0,
    cost:           Number(row.cost)        || 0,
    roi:            Number(row.roi)         || 0,
    device:         type === 'device' ? groupKey : '',
    os:             type === 'os'     ? groupKey : '',
    region:         type === 'region' ? groupKey : '',
  };
}

// 8 report calls in order. Call 1 is traffic_sources (handled separately).
const BREAKDOWNS = [
  { groups: ['date'],              type: 'daily'    },
  { groups: ['date', 'os'],        type: 'os'       },
  { groups: ['date', 'device'],    type: 'device'   },
  { groups: ['date', 'country'],   type: 'region'   },
  { groups: ['date', 'campaign'],  type: 'campaign' },
  { groups: ['date', 'offer'],     type: 'lander'   },
  { groups: ['date', 'adset'],     type: 'adset'    },
  { groups: ['date', 'ad'],        type: 'ad'       },
];

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
    // Call 1: traffic sources to build source → channel/lander map
    const sourceMap = await fetchTrafficSources(apiKey);
    await delay(delayMs);

    const allRows = [];

    for (let i = 0; i < BREAKDOWNS.length; i++) {
      const { groups, type } = BREAKDOWNS[i];
      const rows = await fetchReport(apiKey, date_from, date_to, groups);
      for (const row of rows) {
        if (!row.date) continue;
        allRows.push(makeRow(fetchedAt, type, sourceMap, row));
      }
      if (i < BREAKDOWNS.length - 1) {
        await delay(delayMs);
      }
    }

    if (allRows.length === 0) {
      console.warn('[fetchRedTrack] No rows to insert — skipping');
      return;
    }

    await ch.insert({ table: 'redtrack_stats', values: allRows, format: 'JSONEachRow' });
    console.log(`[fetchRedTrack] Inserted ${allRows.length} rows`);
  } finally {
    await ch.close();
  }
}
