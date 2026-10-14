import { describe, expect, it } from 'vitest';
import { validateTitleAndTags } from '../vault-upload';

describe('validateTitleAndTags', () => {
  it('accepts a proper title and tags', () => {
    const r = validateTitleAndTags('AIHW Youth Mental Health 2024', [
      'mental health',
      'statistics',
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.title).toBe('AIHW Youth Mental Health 2024');
      expect(r.tags).toEqual(['mental health', 'statistics']);
    }
  });

  it('rejects missing title', () => {
    const r = validateTitleAndTags('', ['stats']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/title is required/i);
  });

  it('rejects generic titles', () => {
    for (const t of ['Untitled', 'Untitled Document', 'document', 'new document']) {
      const r = validateTitleAndTags(t, ['ok']);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/too generic|at least 5/i);
    }
  });

  it('rejects short titles', () => {
    const r = validateTitleAndTags('AIHW', ['stats']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/at least 5/i);
  });

  it('rejects empty tags', () => {
    const r = validateTitleAndTags('Real Research Report', []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/tags is required/i);
  });

  it('rejects missing tags array', () => {
    const r = validateTitleAndTags('Real Research Report', undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/tags is required/i);
  });

  it('dedupes tags case-insensitively', () => {
    const r = validateTitleAndTags('Real Research Report', [
      'Stats',
      'stats',
      ' AIHW ',
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tags).toEqual(['Stats', 'AIHW']);
  });
});
