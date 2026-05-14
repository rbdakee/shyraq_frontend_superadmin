import { describe, it, expect } from 'vitest';
import { formatPhoneE164, formatRelativeTime, formatCurrency } from './format';

describe('formatPhoneE164', () => {
  it('formats +7 Kazakhstan number to readable form', () => {
    expect(formatPhoneE164('+77011234567')).toBe('+7 (701) 123-45-67');
  });

  it('returns non-+7 E.164 number as-is', () => {
    expect(formatPhoneE164('+12025551234')).toBe('+12025551234');
  });

  it('returns +7 number shorter than 12 digits as-is', () => {
    expect(formatPhoneE164('+770112345')).toBe('+770112345');
  });

  it('returns empty string for null', () => {
    expect(formatPhoneE164(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatPhoneE164(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatPhoneE164('')).toBe('');
  });

  it('returns non-phone string as-is', () => {
    expect(formatPhoneE164('not-a-phone')).toBe('not-a-phone');
  });
});

describe('formatCurrency', () => {
  it('formats 50000 KZT to contain digits and currency identifier', () => {
    const result = formatCurrency(50000);
    expect(result).toContain('50');
    expect(result).toContain('000');
    // Intl output depends on ICU data: full ICU → '₸', system ICU → 'KZT'
    expect(result.includes('₸') || result.includes('KZT')).toBe(true);
  });

  it('formats 0 KZT to contain zero and currency identifier', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result.includes('₸') || result.includes('KZT')).toBe(true);
  });
});

describe('formatRelativeTime', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatRelativeTime('2026-05-14T08:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
