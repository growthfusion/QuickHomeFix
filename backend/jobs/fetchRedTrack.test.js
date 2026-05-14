import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClose = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClickhouseClient = vi.hoisted(() => ({ insert: mockInsert, close: mockClose }));

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => mockClickhouseClient),
}));

import axios from 'axios';
import { fetchRedTrack } from './fetchRedTrack.js';

const QHF_SOURCE_ID = '6973b115cf6f4f9efdaec963';
const NON_QHF_SOURCE_ID = 'aaabbbccc111222333444555';

describe('fetchRedTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue(undefined);
    process.env.REDTRACK_API_KEY = 'rt_key';
    process.env.CLICKHOUSE_HOST = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
  });

  it('inserts report rows with correct shape including lp_views', async () => {
    axios.get.mockResolvedValueOnce({
      data: [{
        source_id: QHF_SOURCE_ID,
        campaign_id: 'rt_cmp1',
        campaign_name: 'Bath Campaign',
        landing: 'https://example.com/bath',
        lp_views: 500,
        clicks: 200,
        conversions: 15,
        revenue: 300.0,
        cost: 100.0,
        epc: 1.5,
        roi: 200.0,
      }],
    });

    await fetchRedTrack();

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'redtrack_stats',
        format: 'JSONEachRow',
        values: expect.arrayContaining([
          expect.objectContaining({
            campaign_id: 'rt_cmp1',
            landing: 'https://example.com/bath',
            lp_views: 500,
            clicks: 200,
            epc: 1.5,
          }),
        ]),
      })
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('filters out rows whose source_id is not in the QHF set', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { source_id: QHF_SOURCE_ID, campaign_id: 'cmp_qhf', campaign_name: 'QHF Bath', landing: 'l1', lp_views: 100, clicks: 50, conversions: 5, revenue: 0, cost: 0, epc: 0, roi: 0 },
        { source_id: NON_QHF_SOURCE_ID, campaign_id: 'cmp_other', campaign_name: 'Other', landing: 'l2', lp_views: 99, clicks: 99, conversions: 1, revenue: 0, cost: 0, epc: 0, roi: 0 },
      ],
    });

    await fetchRedTrack();

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const insertedRows = mockInsert.mock.calls[0][0].values;
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].campaign_id).toBe('cmp_qhf');
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('skips insert when all rows are filtered out (no QHF source_id)', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { source_id: NON_QHF_SOURCE_ID, campaign_id: 'other', campaign_name: 'Other', landing: 'l1', lp_views: 0, clicks: 10, conversions: 1, revenue: 0, cost: 0, epc: 0, roi: 0 },
      ],
    });

    await fetchRedTrack();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('skips insert when report returns empty array', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    await fetchRedTrack();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('closes the ClickHouse client even when the API call fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('network failure'));

    await fetchRedTrack();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('uses date_from and date_to params (not from/to)', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    await fetchRedTrack();

    const callParams = axios.get.mock.calls[0][1].params;
    expect(callParams).toHaveProperty('date_from');
    expect(callParams).toHaveProperty('date_to');
    expect(callParams).not.toHaveProperty('from');
    expect(callParams).not.toHaveProperty('to');
  });
});
