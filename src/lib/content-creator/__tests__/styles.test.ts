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

/* ─── Apr-2026: applies_to + examples fields ─────────────────────────────── */

describe('CreateStyleSchema — applies_to scoping', () => {
  const base = {
    title:  'Storytelling',
    prompt: 'You write in a story-telling voice. Open with a concrete scene or moment.',
  };

  it('accepts a blog-only scope', () => {
    const r = CreateStyleSchema.safeParse({ ...base, applies_to: ['blog'] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.applies_to).toEqual(['blog']);
  });

  it('accepts multi-type scope', () => {
    const r = CreateStyleSchema.safeParse({ ...base, applies_to: ['blog', 'newsletter'] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.applies_to).toEqual(['blog', 'newsletter']);
  });

  it("normalises any array containing 'all' down to ['all']", () => {
    // Prevents ambiguous rows like ['all','blog'] landing in the DB.
    const r = CreateStyleSchema.safeParse({ ...base, applies_to: ['all', 'blog'] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.applies_to).toEqual(['all']);
  });

  it('rejects an empty applies_to array', () => {
    const r = CreateStyleSchema.safeParse({ ...base, applies_to: [] });
    expect(r.success).toBe(false);
  });

  it('rejects an unknown content type value', () => {
    const r = CreateStyleSchema.safeParse({ ...base, applies_to: ['podcast'] });
    expect(r.success).toBe(false);
  });
});

describe('CreateStyleSchema — examples few-shot', () => {
  const base = {
    title:  'Storytelling',
    prompt: 'You write in a story-telling voice. Open with a concrete scene or moment.',
  };

  it('accepts up to 3 examples with optional titles', () => {
    const r = CreateStyleSchema.safeParse({
      ...base,
      examples: [
        { title: 'Opener', snippet: 'The bell rang at 8:47am.' },
        { snippet: 'Most teachers nod when I say this.' },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejects more than 3 examples', () => {
    const snippet = 'Lorem ipsum.';
    const r = CreateStyleSchema.safeParse({
      ...base,
      examples: [{ snippet }, { snippet }, { snippet }, { snippet }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty snippet', () => {
    const r = CreateStyleSchema.safeParse({ ...base, examples: [{ snippet: '' }] });
    expect(r.success).toBe(false);
  });

  it('rejects a snippet over 500 chars', () => {
    const r = CreateStyleSchema.safeParse({
      ...base,
      examples: [{ snippet: 'x'.repeat(501) }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown keys inside an example', () => {
    const r = CreateStyleSchema.safeParse({
      ...base,
      examples: [{ snippet: 'ok', bogus: 1 }],
    });
    expect(r.success).toBe(false);
  });
});
