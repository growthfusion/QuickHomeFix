import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClose = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClickhouseClient = vi.hoisted(() => ({ insert: mockInsert, close: mockClose }));

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => mockClickhouseClient),
}));

import axios from 'axios';
import { fetchLeadProsper } from './fetchLeadProsper.js';

describe('fetchLeadProsper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue(undefined);
    process.env.LEADPROSPER_API_KEY = 'lp_key';
    process.env.CLICKHOUSE_HOST = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
  });

  it('inserts merged stats and accounting rows', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [{
          id: 'c1', name: 'Bath Campaign',

          
          leads_total: 100, leads_accepted: 80,
          leads_failed: 10, leads_returned: 10,
        }],
      })
      .mockResolvedValueOnce({
        data: [{
          campaign_id: 'c1',
          total_buy: 200.0, total_sell: 400.0, net_profit: 200.0,
        }],
      });

    await fetchLeadProsper();

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'leadprosper_stats',
        format: 'JSONEachRow',
        values: expect.arrayContaining([
          expect.objectContaining({
            campaign_id: 'c1',
            campaign_name: 'Bath Campaign',
            leads_total: 100,
            leads_accepted: 80,
            total_buy: 200,
            total_sell: 400,
          }),
        ]),
      })
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('skips insert when stats returns empty array', async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    await fetchLeadProsper();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('closes the ClickHouse client even when the API call fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('network failure'));

    await fetchLeadProsper();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
