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

// Queue all 2 axios.get responses in call order:
//   [0] traffic_sources
//   [1] date → daily
function mockRtApi({
  sources = [],
  daily   = [],
} = {}) {
  axios.get
    .mockResolvedValueOnce({ data: sources })
    .mockResolvedValueOnce({ data: daily });
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

  it('makes exactly 2 API calls (1 traffic_sources + 1 daily report)', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('first call targets /traffic_sources', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(axios.get.mock.calls[0][0]).toContain('/traffic_sources');
  });

  it('report call targets /report with group_by[]=date', async () => {
    mockRtApi();
    await fetchRedTrack();
    const calls = axios.get.mock.calls;
    // calls[0] = traffic_sources; calls[1] = daily report
    expect(calls[1][0]).toMatch(/group_by\[\]=date/);
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

  it('daily row has empty string group_key', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 10 }] });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'daily');
    expect(row.group_key).toBe('');
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

  it('issues a single ch.insert with daily rows', async () => {
    mockRtApi({
      daily: [
        { date: '2026-05-01', lp_views: 10 },
        { date: '2026-05-02', lp_views: 5 },
      ],
    });
    await fetchRedTrack();
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const rows = mockInsert.mock.calls[0][0].values;
    expect(rows.every(r => r.breakdown_type === 'daily')).toBe(true);
    expect(rows).toHaveLength(2);
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
