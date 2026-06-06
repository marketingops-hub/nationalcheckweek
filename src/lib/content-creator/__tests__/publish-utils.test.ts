import { describe, it, expect } from 'vitest';
import { slugify, deriveExcerpt, reserveSlug } from '../publish-utils';

describe('slugify', () => {
  it('kebab-cases and lowercases', () => {
    expect(slugify('Hello World Of Wellbeing')).toBe('hello-world-of-wellbeing');
  });
  it('strips accents and punctuation', () => {
    expect(slugify('Café déjà vu!')).toBe('cafe-deja-vu');
  });
  it('trims leading/trailing separators and caps length', () => {
    expect(slugify('  --Edge--  ')).toBe('edge');
    expect(slugify('x'.repeat(200)).length).toBeLessThanOrEqual(100);
  });
  it('falls back to untitled on empty', () => {
    expect(slugify('')).toBe('untitled');
    expect(slugify('!!!')).toBe('untitled');
  });
});

describe('deriveExcerpt', () => {
  it('takes the first non-empty paragraph, markdown stripped', () => {
    const body = '**Heading**\n\nThis is the *first* real paragraph.\n\nSecond.';
    // default mode: heading line is not skipped, but it is bold-stripped
    expect(deriveExcerpt(body)).toBe('Heading');
  });
  it('skipHeadings skips a bold-only heading paragraph', () => {
    const body = '**Heading**\n\nThis is the real paragraph.';
    expect(deriveExcerpt(body, { skipHeadings: true })).toBe('This is the real paragraph.');
  });
  it('skips a sources divider block', () => {
    const body = '---\n\nActual content here.';
    expect(deriveExcerpt(body)).toBe('Actual content here.');
  });
  it('caps at 300 chars', () => {
    expect(deriveExcerpt('a'.repeat(500)).length).toBe(300);
  });
  it('returns empty string when nothing usable', () => {
    expect(deriveExcerpt('')).toBe('');
  });
});

describe('reserveSlug', () => {
  /** Minimal fake of the chained Supabase query builder. `taken` is the set
   *  of slugs that already exist; the builder resolves to a matching row when
   *  the queried slug is in the set (and not excluded). */
  function fakeSb(taken: Set<string>, opts: { excludeHasSlug?: string } = {}) {
    return {
      from() {
        let slug = '';
        let excludeId: string | null = null;
        // Thenable + chainable: mirrors the real builder where .limit() and
        // .neq() both return the builder and awaiting it runs the query.
        const builder = {
          select() { return builder; },
          eq(_col: string, val: string) { slug = val; return builder; },
          neq(_col: string, id: string) { excludeId = id; return builder; },
          limit() { return builder; },
          then(resolve: (v: { data: { id: string }[] }) => void) {
            const exists = taken.has(slug) &&
              !(excludeId && opts.excludeHasSlug === slug);
            resolve({ data: exists ? [{ id: 'row' }] : [] });
          },
        };
        return builder;
      },
    } as never;
  }

  it('returns the base slug when free', async () => {
    const out = await reserveSlug(fakeSb(new Set()), 'blog_posts', 'my-post', null);
    expect(out).toBe('my-post');
  });

  it('increments on collision', async () => {
    const out = await reserveSlug(fakeSb(new Set(['my-post', 'my-post-2'])), 'pages', 'my-post', null);
    expect(out).toBe('my-post-3');
  });

  it('treats its own row as free via excludeId', async () => {
    // slug is taken, but it belongs to the row we exclude → reuse it
    const sb = fakeSb(new Set(['my-post']), { excludeHasSlug: 'my-post' });
    const out = await reserveSlug(sb, 'blog_posts', 'my-post', 'row');
    expect(out).toBe('my-post');
  });
});
