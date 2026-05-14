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

  it('inserts report rows with correct shape', async () => {
    axios.get.mockResolvedValueOnce({
      data: [{
        campaign_id: 'rt_cmp1',
        campaign_name: 'Bath Campaign',
        landing: 'https://example.com/bath',
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
            clicks: 200,
            epc: 1.5,
          }),
        ]),
      })
    );
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
});
