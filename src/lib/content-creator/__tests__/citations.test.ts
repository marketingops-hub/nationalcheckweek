/* ═══════════════════════════════════════════════════════════════════════════
 * formatCitations — transform raw [vault:uuid] markers into reader-friendly
 * [Source N] references + optional Sources block.
 *
 * The prod implementation is duplicated into supabase/functions/_shared/
 * content-creator/citations.ts; tests only run against the src/ copy but
 * the logic is byte-identical.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect } from 'vitest';
import { formatCitations } from '../citations';

const uuidA = '9b201fd2-fbc0-4cb9-a831-c553fb2bb6c4';
const uuidB = 'aaaabbbb-ffff-4cb9-a831-c553fb2bb6c5';
const uuidC = 'ccccdddd-0000-4cb9-a831-c553fb2bb6c6';

const vault = [
  { id: uuidA, title: 'Mission Australia Youth Survey 2024', source: 'https://example.org/mays-2024' },
  { id: uuidB, title: 'AIHW Children Mental Health Overview', source: 'https://aihw.gov.au/overview' },
  { id: uuidC, title: 'Free-text source with no URL',        source: null },
];

describe('formatCitations — blog (verbose)', () => {
  it('replaces [vault:uuid] with [Source N] in order of first appearance', () => {
    const body = `Finland leads [vault:${uuidA}]. HK too [vault:${uuidB}]. Finland again [vault:${uuidA}].`;
    const out  = formatCitations(body, vault, 'blog');

    expect(out.body).toContain('Finland leads [Source 1]');
    expect(out.body).toContain('HK too [Source 2]');
    expect(out.body).toContain('Finland again [Source 1]');   // dedup
    expect(out.ordered_vault_ids).toEqual([uuidA, uuidB]);
  });

  it('appends a Sources block with title + URL', () => {
    const body = `Claim [vault:${uuidA}].`;
    const out  = formatCitations(body, vault, 'blog');

    expect(out.body).toMatch(/Sources:\n\[1\] Mission Australia Youth Survey 2024 — https:\/\/example\.org\/mays-2024/);
  });

  it('omits the URL segment when source is null/empty', () => {
    const body = `Claim [vault:${uuidC}].`;
    const out  = formatCitations(body, vault, 'blog');

    expect(out.body).toMatch(/\[1\] Free-text source with no URL\s*$/m);
    expect(out.body).not.toMatch(/Free-text source with no URL —/);
  });

  it('returns the body unchanged when there are no citations', () => {
    const body = 'No citations here.';
    const out  = formatCitations(body, vault, 'blog');

    expect(out.body).toBe(body);
    expect(out.ordered_vault_ids).toEqual([]);
  });

  it('is case-insensitive on the uuid match', () => {
    const body = `Mixed case [vault:${uuidA.toUpperCase()}].`;
    const out  = formatCitations(body, vault, 'blog');

    expect(out.body).toContain('[Source 1]');
    expect(out.ordered_vault_ids).toEqual([uuidA]);
  });

  it('handles an unknown uuid gracefully (no vault entry) — still numbers it', () => {
    const unknown = '00000000-0000-4cb9-a831-000000000000';
    const body = `Claim [vault:${unknown}].`;
    const out  = formatCitations(body, [], 'blog');

    expect(out.body).toContain('[Source 1]');
    expect(out.body).toContain('Untitled source');
  });
});

describe('formatCitations — social (compact)', () => {
  it('uses short [N] markers and does NOT append a Sources block', () => {
    const body = `Short post [vault:${uuidA}] #tag`;
    const out  = formatCitations(body, vault, 'social');

    expect(out.body).toBe('Short post [1] #tag');
    expect(out.body).not.toMatch(/Sources:/);
    expect(out.citation_style).toBe('compact');
  });

  it('preserves numbering across multiple cites in a short post', () => {
    const body = `[vault:${uuidA}] and [vault:${uuidB}] and [vault:${uuidA}]`;
    const out  = formatCitations(body, vault, 'social');

    expect(out.body).toBe('[1] and [2] and [1]');
  });
});

describe('formatCitations — newsletter', () => {
  it('uses verbose style and appends Sources block (same as blog)', () => {
    const body = `Hi {{first_name}}, [vault:${uuidB}].`;
    const out  = formatCitations(body, vault, 'newsletter');

    expect(out.body).toContain('[Source 1]');
    expect(out.body).toMatch(/Sources:\n\[1\] AIHW Children Mental Health Overview/);
    expect(out.citation_style).toBe('verbose');
  });
});

describe('formatCitations — Sources block dedupe', () => {
  it('skips append when model already emitted a "## Sources" heading near the tail', () => {
    const body = [
      `Intro claim [vault:${uuidA}].`,
      `Another claim [vault:${uuidB}].`,
      ``,
      `## Sources`,
      `- Some link the model made up`,
    ].join('\n');
    const out = formatCitations(body, vault, 'blog');
    // Markers replaced but no second Sources section appended.
    expect(out.body).toContain('[Source 1]');
    expect(out.body).toContain('[Source 2]');
    // Only one Sources/references-style heading in the final body.
    const matches = out.body.match(/^(?:#{1,6}\s*)?(sources|references)\s*:?\s*$/gim) ?? [];
    expect(matches.length).toBe(1);
  });

  it('skips append when model wrote a plain "References:" label', () => {
    const body = [
      `Claim one [vault:${uuidA}].`,
      ``,
      `References:`,
      `1. Something`,
    ].join('\n');
    const out = formatCitations(body, vault, 'blog');
    expect(out.body).not.toContain('---\nSources:');
  });

  it('is idempotent: running formatCitations twice on long-form does not double-append', () => {
    const body = `Original [vault:${uuidA}] and another [vault:${uuidB}].`;
    const once = formatCitations(body, vault, 'blog');
    // Second pass uses the already-transformed body (which has our own
    // Sources block near the end) — should not append a second one.
    const twice = formatCitations(once.body, vault, 'blog');
    const occurrences = (twice.body.match(/\nSources:\n/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('does NOT dedupe when "sources" appears in the middle of prose', () => {
    // First line mentions "sources" in prose; tail does not have a heading.
    // formatCitations should still append.
    const body = [
      `Our sources matter. [vault:${uuidA}]`,
      `Second paragraph [vault:${uuidB}].`,
      `Third paragraph with content.`,
      `Fourth paragraph wraps up.`,
      `Fifth paragraph final words.`,
    ].join('\n');
    const out = formatCitations(body, vault, 'blog');
    expect(out.body).toContain('\nSources:');
  });
});
