/* ═══════════════════════════════════════════════════════════════════════════
 * Zod validation for Writing Styles.
 *
 * These mirror the DB CHECK constraints so we reject bad payloads before
 * they reach Postgres — the admin sees a Zod message, not a PG one.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect } from 'vitest';
import {
  CreateStyleSchema,
  PatchStyleSchema,
} from '../styles';

describe('CreateStyleSchema', () => {
  const valid = {
    title:  'Storytelling',
    prompt: 'You write in a story-telling voice. Open with a concrete scene or moment.',
  };

  it('accepts a minimal valid payload', () => {
    expect(CreateStyleSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a prompt under 10 chars', () => {
    const r = CreateStyleSchema.safeParse({ ...valid, prompt: 'too short' });
    expect(r.success).toBe(false);
  });

  it('rejects a prompt over 4000 chars', () => {
    const r = CreateStyleSchema.safeParse({ ...valid, prompt: 'x'.repeat(4001) });
    expect(r.success).toBe(false);
  });

  it('rejects a missing title', () => {
    const r = CreateStyleSchema.safeParse({ prompt: valid.prompt });
    expect(r.success).toBe(false);
  });

  it('rejects a title over 120 chars', () => {
    const r = CreateStyleSchema.safeParse({ ...valid, title: 'x'.repeat(121) });
    expect(r.success).toBe(false);
  });

  it('strips unknown fields via .strict()', () => {
    const r = CreateStyleSchema.safeParse({ ...valid, bogus: true });
    expect(r.success).toBe(false);
  });

  it('accepts optional description + is_active + sort_order', () => {
    const r = CreateStyleSchema.safeParse({
      ...valid,
      description: 'narrative-led',
      is_active:   false,
      sort_order:  100,
    });
    expect(r.success).toBe(true);
  });
});

describe('PatchStyleSchema', () => {
  it('accepts a partial patch (only is_active)', () => {
    const r = PatchStyleSchema.safeParse({ is_active: false });
    expect(r.success).toBe(true);
  });

  it('accepts an empty object — the API route handles the "nothing to update" case', () => {
    // Schema itself must not reject empty; the route returns 400 instead so
    // the UI can show a precise message.
    const r = PatchStyleSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const r = PatchStyleSchema.safeParse({ title: 'ok', bogus: 1 });
    expect(r.success).toBe(false);
  });

  it('enforces the same prompt bounds as Create', () => {
    expect(PatchStyleSchema.safeParse({ prompt: 'short' }).success).toBe(false);
    expect(PatchStyleSchema.safeParse({ prompt: 'x'.repeat(4001) }).success).toBe(false);
  });
});
