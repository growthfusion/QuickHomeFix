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
import { fetchThumbTack } from './fetchThumbTack.js';

const CSV_HEADER =
  'day,utm_source,channel,utm_campaign,utm_content,category,sessions,visitors,' +
  'projects_created,contacts_created,pros_contacted,pros_charged,pros_refunded,' +
  'requests_paid_on,revenue,refund,net_revenue,cost_deduction,revenue_minus_costs,owed_revenue';

// One QHF row (Bathroom Remodel → bath) with real owed_revenue, plus a non-QHF
// row (Fence) that must be filtered out.
const SHEET_CSV = [
  CSV_HEADER,
  '5/26/2026,cma,gf,12345,,Bathroom Remodel,28,28,5,8,2,$0,$0,$2,$68.97,$0,$0,$0,$0,$26.76',
  '5/26/2026,cma,gf,67890,,Fence and Gate Installation,14,14,4,8,8,$0,$0,$4,$592.92,$0,$0,$0,$0,$230.05',
].join('\n');

describe('fetchThumbTack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue(undefined);
    mockCommand.mockResolvedValue(undefined);
    process.env.CLICKHOUSE_HOST     = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
    axios.get.mockResolvedValue({ data: SHEET_CSV });
  });

  it('inserts only QHF-mapped categories (Fence row filtered out)', async () => {
    await fetchThumbTack();
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const { table, values } = mockInsert.mock.calls[0][0];
    expect(table).toBe('thumbtack_stats');
    expect(values).toHaveLength(1);
    expect(values[0].form_type).toBe('bath');
    expect(values[0].owed_revenue).toBeCloseTo(26.76);
  });

  it('NEVER issues a TRUNCATE — that wipes the table if the insert then fails', async () => {
    await fetchThumbTack();
    const truncated = mockCommand.mock.calls.some(
      ([arg]) => /TRUNCATE/i.test(arg?.query || '')
    );
    expect(truncated).toBe(false);
  });

  it('inserts the new batch BEFORE deleting old batches (no empty-table window)', async () => {
    const order = [];
    mockInsert.mockImplementation(async () => { order.push('insert'); });
    mockCommand.mockImplementation(async ({ query }) => {
      if (/DELETE/i.test(query)) order.push('delete');
    });
    await fetchThumbTack();
    expect(order).toEqual(['insert', 'delete']);
  });

  it('purges only prior fetch batches via fetched_at filter', async () => {
    await fetchThumbTack();
    const deleteCall = mockCommand.mock.calls.find(
      ([arg]) => /DELETE/i.test(arg?.query || '')
    );
    expect(deleteCall).toBeTruthy();
    expect(deleteCall[0].query).toMatch(/fetched_at\s*!=/);
  });
});
