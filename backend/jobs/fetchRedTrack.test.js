import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClose  = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClickhouseClient = vi.hoisted(() => ({ insert: mockInsert, close: mockClose }));

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => mockClickhouseClient),
}));

import axios from 'axios';
import { fetchRedTrack } from './fetchRedTrack.js';

// Queue all 9 axios.get responses in call order:
//   [0] traffic_sources
//   [1] date          → daily
//   [2] date+os       → os
//   [3] date+device   → device
//   [4] date+country  → region
//   [5] date+campaign → campaign
//   [6] date+offer    → lander
//   [7] date+adset    → adset
//   [8] date+ad       → ad
function mockRtApi({
  sources  = [],
  daily    = [],
  os       = [],
  device   = [],
  country  = [],
  campaign = [],
  offer    = [],
  adset    = [],
  ad       = [],
} = {}) {
  axios.get
    .mockResolvedValueOnce({ data: sources })
    .mockResolvedValueOnce({ data: daily })
    .mockResolvedValueOnce({ data: os })
    .mockResolvedValueOnce({ data: device })
    .mockResolvedValueOnce({ data: country })
    .mockResolvedValueOnce({ data: campaign })
    .mockResolvedValueOnce({ data: offer })
    .mockResolvedValueOnce({ data: adset })
    .mockResolvedValueOnce({ data: ad });
}

describe('fetchRedTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue(undefined);
    process.env.REDTRACK_API_KEY    = 'rt_key';
    process.env.CLICKHOUSE_HOST     = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
    process.env.RT_CALL_DELAY_MS    = '0';
  });

  it('makes exactly 9 API calls (1 traffic_sources + 8 report calls)', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(axios.get).toHaveBeenCalledTimes(9);
  });

  it('first call targets /traffic_sources', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(axios.get.mock.calls[0][0]).toContain('/traffic_sources');
  });

  it('report calls target /report with correct group[] params', async () => {
    mockRtApi();
    await fetchRedTrack();
    const calls = axios.get.mock.calls;
    // calls[0] = traffic_sources; calls[1..8] = report calls
    expect(calls[1][0]).toMatch(/group\[\]=date/);      // daily
    expect(calls[2][0]).toMatch(/group\[\]=os/);        // os
    expect(calls[3][0]).toMatch(/group\[\]=device/);    // device
    expect(calls[4][0]).toMatch(/group\[\]=country/);   // region
    expect(calls[5][0]).toMatch(/group\[\]=campaign/);  // campaign
    expect(calls[6][0]).toMatch(/group\[\]=offer/);     // lander
    expect(calls[7][0]).toMatch(/group\[\]=adset/);     // adset
    expect(calls[8][0]).toMatch(/group\[\]=ad/);        // ad (not adset)
  });

  it('inserts daily rows with breakdown_type=daily and empty group_key', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 100, lp_clicks: 20, cost: 50 }] });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'daily');
    expect(row).toBeDefined();
    expect(row.group_key).toBe('');
    expect(row.lp_views).toBe(100);
    expect(row.lp_clicks).toBe(20);
    expect(row.cost).toBe(50);
  });

  it('computes lp_ctr as (lp_clicks / lp_views) × 100', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 200, lp_clicks: 50 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.lp_ctr).toBeCloseTo(25, 5);
  });

  it('sets lp_ctr to 0 when lp_views is 0', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 0, lp_clicks: 10 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.lp_ctr).toBe(0);
  });

  it('falls back to landing_clicks when lp_clicks is absent', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 100, landing_clicks: 30 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.lp_clicks).toBe(30);
  });

  it('maps purchases field', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', purchases: 5 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.purchases).toBe(5);
  });

  it('maps roi field', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', roi: 150.5 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.roi).toBeCloseTo(150.5);
  });

  it('maps revenue field', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', revenue: 99.99 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.revenue).toBeCloseTo(99.99);
  });

  it('resolves channel_name and lander_name from sourceMap', async () => {
    mockRtApi({
      sources: [{ id: 'src1', name: 'Facebook', lander: { name: 'Bath LP' } }],
      daily: [{ date: '2026-05-01', source_id: 'src1', lp_views: 10 }],
    });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.channel).toBe('Facebook');
    expect(row.lander_name).toBe('Bath LP');
  });

  it('uses empty strings for channel/lander_name when source_id is not in sourceMap', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', source_id: 'unknown_src', lp_views: 10 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.channel).toBe('');
    expect(row.lander_name).toBe('');
  });

  it('stores "unknown" as group_key when derived key is empty on non-daily row', async () => {
    mockRtApi({ os: [{ date: '2026-05-01', os: '' }] });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'os');
    expect(row.group_key).toBe('unknown');
  });

  it('assigns breakdown_type=region for country call', async () => {
    mockRtApi({ country: [{ date: '2026-05-01', country: 'US' }] });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'region');
    expect(row).toBeDefined();
    expect(row.group_key).toBe('US');
    expect(row.region).toBe('US');
  });

  it('assigns breakdown_type=lander for offer call', async () => {
    mockRtApi({ offer: [{ date: '2026-05-01', offer: 'Bath Lander' }] });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'lander');
    expect(row).toBeDefined();
    expect(row.group_key).toBe('Bath Lander');
  });

  it('assigns breakdown_type=adset with adset_name filled from group_key', async () => {
    mockRtApi({ adset: [{ date: '2026-05-01', adset: 'AdSet A' }] });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'adset');
    expect(row).toBeDefined();
    expect(row.group_key).toBe('AdSet A');
    expect(row.adset_name).toBe('AdSet A');
  });

  it('assigns breakdown_type=ad with ad_name filled from group_key', async () => {
    mockRtApi({ ad: [{ date: '2026-05-01', ad: 'Ad Alpha' }] });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'ad');
    expect(row).toBeDefined();
    expect(row.group_key).toBe('Ad Alpha');
    expect(row.ad_name).toBe('Ad Alpha');
  });

  it('filters out rows that have no date field', async () => {
    mockRtApi({
      daily: [
        { date: '2026-05-01', lp_views: 100 },
        { lp_views: 50 },                       // no date — filtered
      ],
    });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    expect(rows).toHaveLength(1);
  });

  it('skips insert when all rows lack a date field', async () => {
    mockRtApi({ daily: [{ lp_views: 50 }] });
    await fetchRedTrack();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('skips insert when all calls return empty arrays', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('issues a single ch.insert with rows from all breakdown types', async () => {
    mockRtApi({
      daily:    [{ date: '2026-05-01', lp_views: 10 }],
      os:       [{ date: '2026-05-01', os: 'iOS', lp_views: 5 }],
      campaign: [{ date: '2026-05-01', campaign: 'Camp A', lp_views: 8 }],
    });
    await fetchRedTrack();
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const rows = mockInsert.mock.calls[0][0].values;
    expect(rows.some(r => r.breakdown_type === 'daily')).toBe(true);
    expect(rows.some(r => r.breakdown_type === 'os')).toBe(true);
    expect(rows.some(r => r.breakdown_type === 'campaign')).toBe(true);
  });

  it('closes the ClickHouse client even when all API calls fail', async () => {
    axios.get.mockRejectedValue(new Error('network error'));
    await fetchRedTrack();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('skips everything when REDTRACK_API_KEY is not set', async () => {
    delete process.env.REDTRACK_API_KEY;
    await fetchRedTrack();
    expect(axios.get).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('passes date_from and date_to (not from/to) to report calls', async () => {
    mockRtApi();
    await fetchRedTrack();
    const reportUrl = axios.get.mock.calls[1][0];
    expect(reportUrl).toMatch(/date_from=/);
    expect(reportUrl).toMatch(/date_to=/);
    expect(reportUrl).not.toMatch(/[?&]from=/);
    expect(reportUrl).not.toMatch(/[?&]to=/);
  });
});
