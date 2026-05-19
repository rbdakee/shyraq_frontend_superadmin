import { describe, it, expect } from 'vitest';
import { maskKZPhone, normalizeToE164, applyBackspaceCorrection } from './phone-format';

describe('maskKZPhone', () => {
  it('empty string passes through', () => expect(maskKZPhone('')).toBe(''));
  it('+ only shows +', () => expect(maskKZPhone('+')).toBe('+'));
  it('+7 partial', () => expect(maskKZPhone('+7')).toBe('+7'));
  it('+7 + area code start', () => expect(maskKZPhone('+770')).toBe('+7 (70'));
  it('+7 full area code', () => expect(maskKZPhone('+7700')).toBe('+7 (700)'));
  it('+7 full KZ number', () => expect(maskKZPhone('+77001234567')).toBe('+7 (700) 123-45-67'));
  it('non-+7 passes raw', () => expect(maskKZPhone('+15551234567')).toBe('+15551234567'));
});

describe('normalizeToE164', () => {
  it('empty -> empty', () => expect(normalizeToE164('')).toBe(''));
  it('masked KZ -> E.164', () =>
    expect(normalizeToE164('+7 (700) 123-45-67')).toBe('+77001234567'));
  it('local 8 -> +7', () => expect(normalizeToE164('87001234567')).toBe('+77001234567'));
  it('local 8 with formatting -> +7', () =>
    expect(normalizeToE164('8 (700) 123-45-67')).toBe('+77001234567'));
  it('international stays', () => expect(normalizeToE164('+15551234567')).toBe('+15551234567'));
  it('digits-only -> +<digits>', () => expect(normalizeToE164('15551234567')).toBe('+15551234567'));
  it('caps KZ at 11 digits (one extra typed digit dropped)', () =>
    expect(normalizeToE164('+777777777777')).toBe('+77777777777'));
  it('caps KZ at 11 digits regardless of overflow length', () =>
    expect(normalizeToE164('+7000000000099')).toBe('+70000000000'));
  it('local 8 overflow also capped at 11', () =>
    expect(normalizeToE164('877777777777')).toBe('+77777777777'));
  it('international capped at E.164 max 15 digits', () =>
    expect(normalizeToE164('+1999999999999999999')).toBe('+199999999999999'));
});

describe('applyBackspaceCorrection', () => {
  it('normal digit add propagates candidate', () => {
    expect(applyBackspaceCorrection('+7', '+77', '+7')).toBe('+77');
  });
  it('normal digit delete propagates candidate', () => {
    expect(
      applyBackspaceCorrection('+77777777777', '+7 (777) 777-77-7', '+7 (777) 777-77-77'),
    ).toBe('+7777777777');
  });
  it('delimiter-only deletion trims last digit', () => {
    expect(
      applyBackspaceCorrection('+77777777777', '+7 (777 777-77-77', '+7 (777) 777-77-77'),
    ).toBe('+7777777777');
  });
  it('no-op paste with same value passes through', () => {
    expect(
      applyBackspaceCorrection('+77777777777', '+7 (777) 777-77-77', '+7 (777) 777-77-77'),
    ).toBe('+77777777777');
  });
  // Reported bug: full 11-digit value, mask pinned, user types a 12th digit ->
  // browser appends it to the displayed mask. Value must stay capped at 11.
  it('typing past a full KZ number does not leak a 12th digit', () => {
    expect(
      applyBackspaceCorrection('+77777777777', '+7 (777) 777-77-777', '+7 (777) 777-77-77'),
    ).toBe('+77777777777');
  });
});
