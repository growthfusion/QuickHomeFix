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

  it('inserts per-day rows with correct shape', async () => {
    // Each day makes 2 calls: stats then accounting
    // Use mockImplementation to return the right shape by URL
    axios.get.mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          data: [{
            campaign: {
              id: 'c1', name: 'Bath Campaign',
              leads_total: 10, leads_accepted: 8,
              leads_failed: 1, leads_returned: 1,
            },
            suppliers: [],
            buyers: [],
          }],
        });
      }
      return Promise.resolve({
        data: [{ campaign_id: 'c1', total_buy: 20.0, total_sell: 40.0, net_profit: 20.0 }],
      });
    });

    await fetchLeadProsper();

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const { values } = mockInsert.mock.calls[0][0];

    // Each row should have the correct shape
    const first = values[0];
    expect(first).toMatchObject({
      campaign_id: 'c1',
      campaign_name: 'Bath Campaign',
      leads_total: 10,
      leads_accepted: 8,
      total_buy: 20,
      total_sell: 40,
    });

    // date should be a YYYY-MM-DD string matching the current month
    expect(first.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Multiple rows (one per day of current month that has data)
    expect(values.length).toBeGreaterThanOrEqual(1);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('each row carries the date of its respective day', async () => {
    const callDates = [];
    axios.get.mockImplementation((url, opts) => {
      if (url.includes('/stats')) {
        const day = opts.params.start_date;
        callDates.push(day);
        return Promise.resolve({
          data: [{ campaign: { id: 'c1', name: 'Bath', leads_total: 1, leads_accepted: 1, leads_failed: 0, leads_returned: 0 } }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    await fetchLeadProsper();

    const insertedRows = mockInsert.mock.calls[0][0].values;
    // Every inserted row's date should match one of the fetched days
    insertedRows.forEach(row => {
      expect(callDates).toContain(row.date);
    });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('skips insert when all days return empty stats', async () => {
    axios.get.mockResolvedValue({ data: [] });

    await fetchLeadProsper();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('inserts rows from successful days even when some days fail', async () => {
    let callCount = 0;
    axios.get.mockImplementation((url) => {
      callCount++;
      // Fail the first stats call, succeed all others
      if (callCount === 1) return Promise.reject(new Error('day 1 failed'));
      if (url.includes('/stats')) {
        return Promise.resolve({
          data: [{ campaign: { id: 'c1', name: 'Bath', leads_total: 5, leads_accepted: 4, leads_failed: 0, leads_returned: 0 } }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    await fetchLeadProsper();

    // Some days succeeded → insert was called
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('closes the ClickHouse client even when all API calls fail', async () => {
    axios.get.mockRejectedValue(new Error('network failure'));

    await fetchLeadProsper();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
