import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert  = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockCommand = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClose   = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClickhouseClient = vi.hoisted(() => ({ insert: mockInsert, command: mockCommand, close: mockClose }));

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => mockClickhouseClient),
}));

import axios from 'axios';
import { fetchRedTrack } from './fetchRedTrack.js';

// Queue axios responses in call order:
//   [0] /sources (QHF source IDs)
//   [1] /report group=date (daily totals)
//   [2] /report group=date,source (per-source breakdown)
function mockRtApi({
  sources = [{ id: 'src_kg_bath', title: 'QuickHomeFix | Meta | Bath | Karigouda' }],
  daily   = [],
  source  = [],
} = {}) {
  axios.get
    .mockResolvedValueOnce({ data: sources })
    .mockResolvedValueOnce({ data: daily })
    .mockResolvedValueOnce({ data: source });
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

  it('makes exactly 3 API calls (1 sources + 1 daily + 1 source-breakdown report)', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(axios.get).toHaveBeenCalledTimes(3);
  });

  it('first call targets /sources', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(axios.get.mock.calls[0][0]).toContain('/sources');
  });

  it('daily report call uses group=date', async () => {
    mockRtApi();
    await fetchRedTrack();
    const url = axios.get.mock.calls[1][0];
    expect(url).toMatch(/group=date/);
    expect(url).not.toMatch(/group_by/);
  });

  it('source report call uses group=date%2Csource or group=date,source', async () => {
    mockRtApi();
    await fetchRedTrack();
    const url = axios.get.mock.calls[2][0];
    expect(url).toMatch(/group=date/);
    expect(url).toMatch(/source/);
  });

  it('report calls include source_id filter with QHF sources', async () => {
    mockRtApi();
    await fetchRedTrack();
    const url = axios.get.mock.calls[1][0];
    expect(url).toMatch(/source_id=/);
  });

  it('report calls include date_from and date_to (not from/to)', async () => {
    mockRtApi();
    await fetchRedTrack();
    const url = axios.get.mock.calls[1][0];
    expect(url).toMatch(/date_from=/);
    expect(url).toMatch(/date_to=/);
    expect(url).not.toMatch(/[?&]from=/);
    expect(url).not.toMatch(/[?&]to=/);
  });

  it('inserts daily rows with breakdown_type=daily and empty group_key', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 38, lp_clicks: 17, cost: 235 }] });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'daily');
    expect(row).toBeDefined();
    expect(row.group_key).toBe('');
    expect(row.lp_views).toBe(38);
    expect(row.lp_clicks).toBe(17);
    expect(row.cost).toBe(235);
  });

  it('inserts source rows with breakdown_type=source and group_key=source_title', async () => {
    mockRtApi({
      source: [{ date: '2026-05-01', source: 'QuickHomeFix | Meta | Bath | Karigouda', lp_views: 25, lp_clicks: 11, cost: 148 }],
    });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'source');
    expect(row).toBeDefined();
    expect(row.group_key).toBe('QuickHomeFix | Meta | Bath | Karigouda');
    expect(row.lp_views).toBe(25);
    expect(row.lp_clicks).toBe(11);
  });

  it('computes lp_ctr as (lp_clicks / lp_views) × 100', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 50, lp_clicks: 25 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.lp_ctr).toBeCloseTo(50, 5);
  });

  it('sets lp_ctr to 0 when lp_views is 0', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 0, lp_clicks: 5 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.lp_ctr).toBe(0);
  });

  it('parses rt_owner=kg from "QuickHomeFix | Meta | Bath | Karigouda" source', async () => {
    mockRtApi({
      source: [{ date: '2026-05-01', source: 'QuickHomeFix | Meta | Bath | Karigouda', lp_views: 5 }],
    });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'source');
    expect(row.rt_owner).toBe('kg');
    expect(row.rt_service).toBe('bath');
    expect(row.rt_platform).toBe('meta');
  });

  it('parses rt_owner=ak from "QuickHomeFix | Meta | Roof | Ankith" source', async () => {
    mockRtApi({
      source: [{ date: '2026-05-01', source: 'QuickHomeFix | Meta | Roof | Ankith', lp_views: 3 }],
    });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'source');
    expect(row.rt_owner).toBe('ak');
    expect(row.rt_service).toBe('roof');
    expect(row.rt_platform).toBe('meta');
  });

  it('parses rt_owner=viknesh from "QuickHomeFix | Google | Bath" source', async () => {
    mockRtApi({
      source: [{ date: '2026-05-01', source: 'QuickHomeFix | Google | Bath', lp_views: 2 }],
    });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'source');
    expect(row.rt_owner).toBe('viknesh');
    expect(row.rt_service).toBe('bath');
    expect(row.rt_platform).toBe('google');
  });

  it('parses rt_platform=snap from "QuickHomeFix | Snap | Bath" source', async () => {
    mockRtApi({
      source: [{ date: '2026-05-01', source: 'QuickHomeFix | Snap | Bath', lp_views: 2 }],
    });
    await fetchRedTrack();
    const rows = mockInsert.mock.calls[0][0].values;
    const row = rows.find(r => r.breakdown_type === 'source');
    expect(row.rt_platform).toBe('snap');
    expect(row.rt_service).toBe('bath');
  });

  it('issues a single ch.insert with daily and source rows combined', async () => {
    mockRtApi({
      daily: [
        { date: '2026-05-01', lp_views: 38, lp_clicks: 17 },
      ],
      source: [
        { date: '2026-05-01', source: 'QuickHomeFix | Meta | Bath | Karigouda', lp_views: 25, lp_clicks: 11 },
        { date: '2026-05-01', source: 'QuickHomeFix | Google | Roof', lp_views: 13, lp_clicks: 6 },
      ],
    });
    await fetchRedTrack();
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const rows = mockInsert.mock.calls[0][0].values;
    expect(rows).toHaveLength(3);
    expect(rows.filter(r => r.breakdown_type === 'daily')).toHaveLength(1);
    expect(rows.filter(r => r.breakdown_type === 'source')).toHaveLength(2);
  });

  it('filters out rows that have no date field', async () => {
    mockRtApi({
      daily: [
        { date: '2026-05-01', lp_views: 38 },
        { lp_views: 50 }, // no date — filtered
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

  it('uses fallback source IDs when /sources returns no QHF sources', async () => {
    axios.get
      .mockResolvedValueOnce({ data: [{ id: 'other', title: 'Some Other Source' }] }) // no QHF
      .mockResolvedValueOnce({ data: [{ date: '2026-05-01', lp_views: 5 }] })
      .mockResolvedValueOnce({ data: [] });
    await fetchRedTrack();
    // Should still make the report calls using fallback IDs
    expect(axios.get).toHaveBeenCalledTimes(3);
    const reportUrl = axios.get.mock.calls[1][0];
    expect(reportUrl).toMatch(/source_id=/);
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

  it('maps revenue field', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', revenue: 27.83 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.revenue).toBeCloseTo(27.83);
  });

  it('maps roi field', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', roi: 0.1221 }] });
    await fetchRedTrack();
    const row = mockInsert.mock.calls[0][0].values[0];
    expect(row.roi).toBeCloseTo(0.1221);
  });
});
