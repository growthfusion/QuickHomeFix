import { describe, it, expect } from 'vitest';
import { inferFormTypeFromLead } from '../server.js';
import { z } from 'zod';

describe('inferFormTypeFromLead', () => {
  // normalized_service priority
  it('returns bath for BATH_REMODEL', () => {
    expect(inferFormTypeFromLead('BATH_REMODEL', null)).toBe('bath');
  });
  it('returns bath for TUB_REPLACEMENT', () => {
    expect(inferFormTypeFromLead('TUB_REPLACEMENT', null)).toBe('bath');
  });
  it('returns bath for SHOWER_INSTALL', () => {
    expect(inferFormTypeFromLead('SHOWER_INSTALL', null)).toBe('bath');
  });
  it('returns roof for ROOFING_ASPHALT', () => {
    expect(inferFormTypeFromLead('ROOFING_ASPHALT', null)).toBe('roof');
  });
  it('returns windo for WINDOWS', () => {
    expect(inferFormTypeFromLead('WINDOWS', null)).toBe('windo');
  });

  // URL fallback when normalized_service is null
  it('falls back to url: /get-quotes/bath', () => {
    expect(inferFormTypeFromLead(null, 'https://quickhomefix.com/get-quotes/bath')).toBe('bath');
  });
  it('falls back to url: /shower', () => {
    expect(inferFormTypeFromLead(null, 'https://quickhomefix.com/shower')).toBe('bath');
  });
  it('falls back to url: /get-quotes/roof', () => {
    expect(inferFormTypeFromLead(null, 'https://quickhomefix.com/get-quotes/roof')).toBe('roof');
  });
  it('falls back to url: /window', () => {
    expect(inferFormTypeFromLead(null, 'https://quickhomefix.com/window')).toBe('windo');
  });

  // Unrecognised
  it('returns other when both null', () => {
    expect(inferFormTypeFromLead(null, null)).toBe('other');
  });
  it('returns other for unrecognised service', () => {
    expect(inferFormTypeFromLead('GUTTERS', 'https://quickhomefix.com/gutters')).toBe('other');
  });

  // normalized_service takes priority over url
  it('service wins over url when both set', () => {
    expect(inferFormTypeFromLead('ROOFING_ASPHALT', 'https://quickhomefix.com/get-quotes/bath')).toBe('roof');
  });
});

describe('campaign_mapping POST schema', () => {
  const CampaignMappingSchema = z.object({
    meta_campaign_id: z.string().min(1),
    lp_campaign_id:   z.string().min(1),
    rt_source_id:     z.string().default(''),
    form_type:        z.enum(['bath', 'roof', 'windo', 'other']),
    label:            z.string().optional(),
  });

  it('accepts valid payload', () => {
    const result = CampaignMappingSchema.safeParse({
      meta_campaign_id: '123',
      lp_campaign_id:   '456',
      form_type:        'bath',
    });
    expect(result.success).toBe(true);
    expect(result.data.rt_source_id).toBe('');
  });

  it('rejects missing meta_campaign_id', () => {
    const result = CampaignMappingSchema.safeParse({
      lp_campaign_id: '456',
      form_type:      'bath',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid form_type', () => {
    const result = CampaignMappingSchema.safeParse({
      meta_campaign_id: '123',
      lp_campaign_id:   '456',
      form_type:        'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts label as optional', () => {
    const result = CampaignMappingSchema.safeParse({
      meta_campaign_id: '123',
      lp_campaign_id:   '456',
      form_type:        'roof',
      label:            'My Campaign',
    });
    expect(result.success).toBe(true);
    expect(result.data.label).toBe('My Campaign');
  });
});

describe('leads-breakdown response shape', () => {
  it('state row has required fields', () => {
    const row = { state: 'CA', form_type: 'bath', date: '2026-05-01', leads: '10', sold: '5', revenue: '500.00' };
    expect(row).toHaveProperty('state');
    expect(row).toHaveProperty('form_type');
    expect(row).toHaveProperty('leads');
    expect(row).toHaveProperty('sold');
    expect(row).toHaveProperty('revenue');
  });

  it('device row has required fields', () => {
    const row = { device: 'mobile', form_type: 'roof', date: '2026-05-01', leads: '3', sold: '1', revenue: '100.00' };
    expect(row).toHaveProperty('device');
    expect(row).toHaveProperty('form_type');
  });

  it('os row has required fields', () => {
    const row = { os: 'ios', form_type: 'windo', date: '2026-05-01', leads: '2', sold: '0', revenue: '0' };
    expect(row).toHaveProperty('os');
    expect(row).toHaveProperty('form_type');
  });

  it('daily row has required fields', () => {
    const row = { date: '2026-05-01', form_type: 'bath', leads: '8', sold: '4', revenue: '400.00' };
    expect(row).toHaveProperty('date');
    expect(row).toHaveProperty('form_type');
  });
});
