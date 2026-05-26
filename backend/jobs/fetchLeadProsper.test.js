import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockCommand = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClose = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClickhouseClient = vi.hoisted(() => ({ insert: mockInsert, command: mockCommand, close: mockClose }));

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => mockClickhouseClient),
}));

import axios from 'axios';
import { fetchLeadProsper } from './fetchLeadProsper.js';
import {
  buildLeadRecordRows,
  computeAggBuyer,
  computeAggBuyerState,
  computeAggBuyerStateCity,
  computeAggBuyerPostal,
} from './fetchLeadProsper.js';

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
          data: [{ campaign: { id: 'c1', name: 'Bath', leads_total: 1, leads_accepted: 1, leads_failed: 0, leads_returned: 0 }, suppliers: [], buyers: [] }],
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

  it('inserts buyer rows into leadprosper_buyer_stats when buyers are present', async () => {
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
            buyers: [
              {
                id: 'b1', name: 'Modernize', client_id: 100, client_company: 'Modernize',
                leads_total: 5, leads_accepted: 3, leads_duplicated: 0,
                leads_failed: 2, leads_returned: 0,
                pings_total: 10, pings_accepted: 8, pings_failed: 2,
                total_sell: 30.0, gross_revenue: 30.0, net_revenue: 30.0,
                returned_revenue: 0, net_leads_accepted: 3,
              },
              {
                id: 'b2', name: 'Remodelwell', client_id: 101, client_company: 'Remodelwell',
                leads_total: 5, leads_accepted: 5, leads_duplicated: 0,
                leads_failed: 0, leads_returned: 0,
                pings_total: 10, pings_accepted: 10, pings_failed: 0,
                total_sell: 50.0, gross_revenue: 50.0, net_revenue: 50.0,
                returned_revenue: 0, net_leads_accepted: 5,
              },
            ],
          }],
        });
      }
      return Promise.resolve({
        data: [{ campaign_id: 'c1', total_buy: 20.0, total_sell: 80.0, net_profit: 60.0 }],
      });
    });

    await fetchLeadProsper();

    // Two inserts: one for leadprosper_stats, one for leadprosper_buyer_stats
    expect(mockInsert).toHaveBeenCalledTimes(2);

    const buyerCall = mockInsert.mock.calls.find(c => c[0].table === 'leadprosper_buyer_stats');
    expect(buyerCall).toBeDefined();

    const buyerRows = buyerCall[0].values;
    expect(buyerRows.length).toBeGreaterThanOrEqual(2);

    expect(buyerRows[0]).toMatchObject({
      campaign_id: 'c1',
      campaign_name: 'Bath Campaign',
      buyer_id: 'b1',
      buyer_name: 'Modernize',
      leads_total: 5,
      leads_accepted: 3,
      leads_duplicated: 0,
      leads_failed: 2,
      leads_returned: 0,
      pings_total: 10,
      pings_accepted: 8,
      pings_failed: 2,
      total_sell: 30,
      gross_revenue: 30,
      net_revenue: 30,
      returned_revenue: 0,
      net_leads_accepted: 3,
    });

    expect(buyerRows[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(buyerRows[1]).toMatchObject({
      campaign_id: 'c1',
      campaign_name: 'Bath Campaign',
      buyer_id: 'b2',
      buyer_name: 'Remodelwell',
      leads_total: 5,
      leads_accepted: 5,
      total_sell: 50,
      net_revenue: 50,
      net_leads_accepted: 5,
    });
    expect(buyerRows[1].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('does not insert buyer rows when all campaigns have empty buyers arrays', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          data: [{
            campaign: { id: 'c1', name: 'Bath', leads_total: 5, leads_accepted: 4, leads_failed: 0, leads_returned: 0 },
            suppliers: [],
            buyers: [],
          }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    await fetchLeadProsper();

    // Only one insert: leadprosper_stats — no buyer insert
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0].table).toBe('leadprosper_stats');
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});

// ── Pure function unit tests ─────────────────────────────────────────────────
describe('buildLeadRecordRows', () => {
  const TS = '2026-05-26 12:00:00';

  it('returns one row per buyer per lead', () => {
    const leads = [{
      id: 'lead1', lead_date_ms: '1779753600000', status: 'ACCEPTED',
      revenue: 30, cost: 0, campaign_id: 33966, campaign_name: 'Bath',
      returned: false, return_reason: '', test: false, error_code: 0, error_message: '',
      lead_data: { state: 'CA', city: 'Los Angeles', postalCode: '90001', service: 'BATH_REMODEL', rt_ad: 'ad1', source_id: 'gf2' },
      supplier: { id: '110222', name: 'Karigouda' },
      buyers: [
        { id: 'b1', name: 'Modernize',  status: 'ACCEPTED', sell_price: 30, error_code: 0, error_message: '' },
        { id: 'b2', name: 'Remodelwell', status: 'OUTBID',  sell_price: 0,  error_code: 0, error_message: '' },
      ],
    }];

    const rows = buildLeadRecordRows(TS, leads);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      fetched_at: TS, lead_id: 'lead1', lead_date: '2026-05-26',
      campaign_id: '33966', campaign_name: 'Bath', lead_status: 'ACCEPTED',
      revenue: 30, state: 'CA', city: 'Los Angeles', postal_code: '90001',
      service: 'BATH_REMODEL', supplier_name: 'Karigouda',
      buyer_id: 'b1', buyer_name: 'Modernize', buyer_status: 'ACCEPTED', sell_price: 30,
    });
    expect(rows[1]).toMatchObject({ buyer_id: 'b2', buyer_status: 'OUTBID', sell_price: 0 });
  });

  it('returns empty array for empty input', () => {
    expect(buildLeadRecordRows(TS, [])).toEqual([]);
  });

  it('skips buyers array gracefully when absent', () => {
    const leads = [{
      id: 'lead2', lead_date_ms: '1748260800000', status: 'ERROR',
      revenue: 0, cost: 0, campaign_id: 33966, campaign_name: 'Bath',
      returned: false, return_reason: '', test: false, error_code: 1, error_message: 'err',
      lead_data: { state: 'TX', city: 'Austin', postalCode: '78701', service: 'BATH_REMODEL', rt_ad: '', source_id: '' },
      supplier: { id: '110222', name: 'Karigouda' },
      buyers: [],
    }];
    expect(buildLeadRecordRows(TS, leads)).toEqual([]);
  });
});

describe('computeAggBuyer', () => {
  const TS = '2026-05-26 12:00:00';

  const sampleLeadRows = [
    { buyer_id: 'b1', buyer_name: 'Modernize',  buyer_status: 'ACCEPTED', sell_price: 30 },
    { buyer_id: 'b1', buyer_name: 'Modernize',  buyer_status: 'ACCEPTED', sell_price: 20 },
    { buyer_id: 'b1', buyer_name: 'Modernize',  buyer_status: 'ERROR',    sell_price: 0  },
    { buyer_id: 'b1', buyer_name: 'Modernize',  buyer_status: 'OUTBID',   sell_price: 0  },
    { buyer_id: 'b2', buyer_name: 'Remodelwell', buyer_status: 'ACCEPTED', sell_price: 15 },
  ];

  const samplePingRows = [
    { buyer_id: 'b1', pings_total: 10, pings_accepted: 8, pings_failed: 2 },
    { buyer_id: 'b1', pings_total: 5,  pings_accepted: 4, pings_failed: 1 },
  ];

  it('aggregates buyer totals correctly', () => {
    const rows = computeAggBuyer(TS, sampleLeadRows, []);
    const b1 = rows.find(r => r.buyer_id === 'b1');
    expect(b1).toMatchObject({
      fetched_at: TS,
      total_leads: 4, accepted_leads: 2, rejected_leads: 1, outbid_leads: 1,
      sold_leads: 2, total_revenue: 50,
      avg_sell_price: 25,
      acceptance_rate: 50,
      rejection_rate: 25,
      conversion_rate: 50,
    });
  });

  it('merges ping metrics from allBuyerRows', () => {
    const rows = computeAggBuyer(TS, sampleLeadRows, samplePingRows);
    const b1 = rows.find(r => r.buyer_id === 'b1');
    expect(b1).toMatchObject({
      pings_total: 15, pings_accepted: 12, pings_failed: 3,
      ping_accept_rate: 80,
      ping_reject_rate: 20,
    });
  });

  it('sets ping rates to 0 when pings_total is 0', () => {
    const rows = computeAggBuyer(TS, sampleLeadRows, []);
    const b1 = rows.find(r => r.buyer_id === 'b1');
    expect(b1.ping_accept_rate).toBe(0);
    expect(b1.ping_reject_rate).toBe(0);
  });
});

describe('computeAggBuyerState', () => {
  const TS = '2026-05-26 12:00:00';

  it('groups by buyer + state', () => {
    const leadRows = [
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', buyer_status: 'ACCEPTED', sell_price: 30 },
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', buyer_status: 'ERROR',    sell_price: 0  },
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'TX', buyer_status: 'ACCEPTED', sell_price: 20 },
    ];
    const rows = computeAggBuyerState(TS, leadRows);
    expect(rows).toHaveLength(2);
    const ca = rows.find(r => r.state === 'CA');
    expect(ca).toMatchObject({
      buyer_id: 'b1', state: 'CA',
      total_leads: 2, accepted_leads: 1, rejected_leads: 1, sold_leads: 1,
      total_revenue: 30, avg_sell_price: 30, acceptance_rate: 50,
    });
  });
});

describe('computeAggBuyerStateCity', () => {
  const TS = '2026-05-26 12:00:00';

  it('groups by buyer + state + city', () => {
    const leadRows = [
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', city: 'LA',   buyer_status: 'ACCEPTED', sell_price: 30 },
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', city: 'LA',   buyer_status: 'OUTBID',   sell_price: 0  },
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', city: 'SF',   buyer_status: 'ACCEPTED', sell_price: 25 },
    ];
    const rows = computeAggBuyerStateCity(TS, leadRows);
    expect(rows).toHaveLength(2);
    const la = rows.find(r => r.city === 'LA');
    expect(la).toMatchObject({ state: 'CA', city: 'LA', total_leads: 2, sold_leads: 1, total_revenue: 30 });
  });
});

describe('computeAggBuyerPostal', () => {
  const TS = '2026-05-26 12:00:00';

  it('groups by buyer + postal code', () => {
    const leadRows = [
      { buyer_id: 'b1', buyer_name: 'Modernize', postal_code: '90001', state: 'CA', buyer_status: 'ACCEPTED', sell_price: 30 },
      { buyer_id: 'b1', buyer_name: 'Modernize', postal_code: '90001', state: 'CA', buyer_status: 'ERROR',    sell_price: 0  },
      { buyer_id: 'b1', buyer_name: 'Modernize', postal_code: '78701', state: 'TX', buyer_status: 'ACCEPTED', sell_price: 20 },
    ];
    const rows = computeAggBuyerPostal(TS, leadRows);
    expect(rows).toHaveLength(2);
    const zip = rows.find(r => r.postal_code === '90001');
    expect(zip).toMatchObject({ postal_code: '90001', state: 'CA', total_leads: 2, sold_leads: 1, total_revenue: 30 });
  });
});
