import { describe, it, expect } from 'vitest';
import { inferFormTypeFromLead } from '../server.js';

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
