import axios from 'axios';
import { createClient } from '@clickhouse/client';

const META_BASE = 'https://graph.facebook.com/v21.0';

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

async function fetchInsights(accountId, token, params) {
  const all = [];
  let url = `${META_BASE}/act_${accountId}/insights`;
  let queryParams = { access_token: token, limit: 500, ...params };
  while (url) {
    const res = await axios.get(url, { params: queryParams });
    (res.data.data || []).forEach(r => all.push(r));
    url = res.data.paging?.next || null;
    queryParams = {};
  }
  return all;
}

export async function fetchMeta() {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;

  // Fix 1: Guard for missing env vars
  if (!token || !accountId) {
    console.warn('[fetchMeta] META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not set — skipping');
    return;
  }

  const ch = buildClient();


  try {
    let placementData, deviceData, regionData;
    try {
      [placementData, deviceData, regionData] = await Promise.all([
        fetchInsights(accountId, token, {
          level: 'ad',
          fields: 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,date_start,clicks,impressions,ctr,spend',
          breakdowns: 'publisher_platform,platform_position',
          date_preset: 'last_30d',
          time_increment: 1,
        }),
        fetchInsights(accountId, token, {
          level: 'campaign',
          fields: 'campaign_id,campaign_name,date_start,clicks,impressions,spend',
          breakdowns: 'device_platform,impression_device',
          date_preset: 'last_30d',
          
          time_increment: 1,
        }),
        fetchInsights(accountId, token, {
          level: 'campaign',
          fields: 'campaign_id,campaign_name,date_start,clicks,impressions,spend',
          breakdowns: 'region',
          date_preset: 'last_30d',
          time_increment: 1,
        }),
      ]);
    } catch (err) {
      console.error('[fetchMeta] API call failed:', err.message);
      return;
    }

    const placementRows = placementData.map(r => ({
      fetched_at: '',
      date: r.date_start || '',
      campaign_id: r.campaign_id || '',
      campaign_name: r.campaign_name || '',
      adset_id: r.adset_id || '',
      adset_name: r.adset_name || '',
      ad_id: r.ad_id || '',
      ad_name: r.ad_name || '',
      publisher_platform: r.publisher_platform || '',
      placement: r.platform_position || '',
      device: '',
      os: '',
      state: '',
      region: '',
      clicks: Number(r.clicks || 0),
      impressions: Number(r.impressions || 0),
      ctr: Number(r.ctr || 0),
      spend: Number(r.spend || 0),
    }));

    const deviceRows = deviceData.map(r => ({
      fetched_at: '',
      date: r.date_start || '',
      campaign_id: r.campaign_id || '',
      campaign_name: r.campaign_name || '',
      adset_id: '',
      adset_name: '',
      ad_id: '',
      ad_name: '',
      publisher_platform: '',
      placement: '',
      device: r.device_platform || '',
      os: r.impression_device || '',
      state: '',
      region: '',
      clicks: Number(r.clicks || 0),
      impressions: Number(r.impressions || 0),
      ctr: Number(r.impressions || 0) > 0 ? Number(r.clicks || 0) / Number(r.impressions || 0) * 100 : 0,
      spend: Number(r.spend || 0),
    }));

    const regionRows = regionData.map(r => ({
      fetched_at: '',
      date: r.date_start || '',
      campaign_id: r.campaign_id || '',
      campaign_name: r.campaign_name || '',
      adset_id: '',
      adset_name: '',
      ad_id: '',
      ad_name: '',
      publisher_platform: '',
      placement: '',
      device: '',
      os: '',
      state: '',
      region: r.region || '',
      clicks: Number(r.clicks || 0),
      impressions: Number(r.impressions || 0),
      ctr: Number(r.impressions || 0) > 0 ? Number(r.clicks || 0) / Number(r.impressions || 0) * 100 : 0,
      spend: Number(r.spend || 0),
    }));

    const allRows = [...placementRows, ...deviceRows, ...regionRows];
    if (allRows.length === 0) {
      console.log('[fetchMeta] No data returned from Meta API');
      return;
    }

    const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    allRows.forEach(row => { row.fetched_at = fetchedAt; });

    await ch.insert({ table: 'meta_ad_stats', values: allRows, format: 'JSONEachRow' });
    console.log(`[fetchMeta] Inserted ${allRows.length} rows`);
  } finally {
    await ch.close();
  }
}
