import { describe, it, expect } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('transliterates Cyrillic RU', () => {
    expect(slugify('Солнышко')).toBe('solnyshko');
  });
  it('preserves digits and hyphens', () => {
    expect(slugify('Радуга-2')).toBe('raduga-2');
  });
  it('trims and collapses whitespace', () => {
    expect(slugify('  Spaces   Trim  ')).toBe('spaces-trim');
  });
  it('transliterates KK letters via extend map (балапан)', () => {
    expect(slugify('Балапан')).toBe('balapan');
  });
  it('transliterates KK Қ', () => {
    expect(slugify('Қызылорда')).toBe('qyzylorda');
  });
  it('transliterates KK Ұ + ұ + ы (mixed)', () => {
    expect(slugify('Ұжымдастық')).toBe('uzhymdastyq');
  });
  it('drops non-alphanumerics in strict mode', () => {
    expect(slugify('!@# Only Garbage !!!')).toBe('only-garbage');
  });
  it('returns empty string for whitespace-only', () => {
    expect(slugify('   ')).toBe('');
  });
});
