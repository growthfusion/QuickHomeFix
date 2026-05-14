import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClose = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClickhouseClient = vi.hoisted(() => ({ insert: mockInsert, close: mockClose }));

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => mockClickhouseClient),
}));

import axios from 'axios';
import { createClient } from '@clickhouse/client';
import { fetchMeta } from './fetchMeta.js';

describe('fetchMeta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue(undefined);
    process.env.META_ACCESS_TOKEN = 'tok';
    process.env.META_AD_ACCOUNT_ID = '111';
    process.env.CLICKHOUSE_HOST = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
  });

  it('inserts placement rows with correct shape', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          data: [{
            campaign_id: 'cmp1', campaign_name: 'QHF | Bath | test',
            adset_id: 'ads1', adset_name: 'AdSet1',
            ad_id: 'ad1', ad_name: 'Ad1',
            date_start: '2026-05-13',
            publisher_platform: 'facebook', platform_position: 'feed',
            clicks: '50', impressions: '1000', ctr: '5.0', spend: '25.00',
          }],
        },
      })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    await fetchMeta();

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'meta_ad_stats',
        format: 'JSONEachRow',
        values: expect.arrayContaining([
          expect.objectContaining({
            campaign_id: 'cmp1',
            publisher_platform: 'facebook',
            placement: 'feed',
            clicks: 50,
            spend: 25,
            device: '',
            os: '',
            state: '',
            region: '',
          }),
        ]),
      })
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('inserts device rows with correct shape', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({
        data: {
          data: [{
            campaign_id: 'cmp1', campaign_name: 'QHF | Roof | test',
            date_start: '2026-05-13',
            device_platform: 'mobile', impression_device: 'iphone',
            clicks: '30', impressions: '500', spend: '15.00',
          }],
        },
      })
      .mockResolvedValueOnce({ data: { data: [] } });

    await fetchMeta();

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.arrayContaining([
          expect.objectContaining({
            device: 'mobile',
            os: 'iphone',
            publisher_platform: '',
            placement: '',
          }),
        ]),
      })
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('skips insert when all 3 calls return empty data', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    await fetchMeta();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('closes the ClickHouse client even when the API call fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('network failure'));

    await fetchMeta();

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
