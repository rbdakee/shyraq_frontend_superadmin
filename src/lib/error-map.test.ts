import { describe, it, expect } from 'vitest';
import { toI18nKey } from './error-map';
import { AppError } from '@/api/errors';

describe('toI18nKey', () => {
  it('maps AppError code to errors namespace', () => {
    expect(toI18nKey(new AppError('invalid_credentials', 401))).toBe('errors:invalid_credentials');
  });

  it('falls back for plain Error', () => {
    expect(toI18nKey(new Error('boom'))).toBe('errors:unknown_error');
  });

  it('falls back for null/undefined', () => {
    expect(toI18nKey(null)).toBe('errors:unknown_error');
    expect(toI18nKey(undefined)).toBe('errors:unknown_error');
  });

  it('falls back for arbitrary object without code', () => {
    expect(toI18nKey({ foo: 'bar' })).toBe('errors:unknown_error');
  });
});
