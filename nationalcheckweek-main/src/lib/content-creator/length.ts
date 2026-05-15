/* ═══════════════════════════════════════════════════════════════════════════
 * Length / word-count helpers for the content-creator pipeline.
 *
 * Two responsibilities:
 *
 *   1. `countWords(body)` — strip markdown artefacts (headings, list
 *      markers, link syntax, citation markers, Sources block) and count
 *      the remaining words. Used for long-form length gating and for
 *      surfacing a word count in the UI.
 *
 *   2. `wordTarget(content_type)` — the target range per content type,
 *      plus a ±tolerance. These are derived from the rules written into
 *      the generate prompt (prompts.ts · typeSpecificRules) so both stay
 *      consistent. Update them together.
 *
 * Social posts are measured by character count (done elsewhere) — words
 * are a poor metric for a 280-char tweet. So `wordTarget('social')` returns
 * null and the caller knows to skip word gating for that type.
 *
 * IMPORTANT: this file is mirrored at
 *   src/lib/content-creator/length.ts
 * because Deno edge fns can't import from `src/`. Keep them in sync.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface WordTarget {
  min: number;
  max: number;
  /**
   * Tolerance band (fraction). A count within min*(1-tol)…max*(1+tol) is
   * accepted without a retry; outside triggers the regenerate-once gate.
   * 0.15 matches how loosely the model hits the stated range in practice.
   */
  tolerance: number;
}

/** Optional length override surfaced on the "Generate options" modal. */
export type LengthPreset = 'short' | 'standard' | 'long';

/** Mirror of the ranges in prompts.ts · typeSpecificRules. Accepts an
 *  optional `preset` which widens / tightens the baseline range so an
 *  admin can nudge the same brief toward a shorter or longer piece without
 *  re-wording the prompt. Social posts always return null — their length
 *  is driven by platform char limits, not words. */
export function wordTarget(
  content_type: 'social' | 'blog' | 'newsletter' | 'geo',
  preset: LengthPreset = 'standard',
): WordTarget | null {
  if (content_type === 'social') return null;
  // Baseline is the Apr-2026 "standard" range. Presets scale proportionally
  // rather than snap to hand-tuned numbers so we don't pile on config.
  // Blog + GEO standards center on 1000 words (admin-requested Apr 2026).
  // Newsletter baseline held at 300–500 — short-form by design.
  const longForm = content_type === 'blog' || content_type === 'geo';
  const base = longForm
    ? { min: 900, max: 1100 }
    : { min: 300, max: 500 };
  const scale =
    preset === 'short' ? 0.6
    : preset === 'long' ? 1.6
    : 1;
  return {
    min: Math.round(base.min * scale),
    max: Math.round(base.max * scale),
    // Tighter ±10% (was 15%) on standard long-form so "1000 words" actually
    // lands inside ~900–1210 instead of drifting up to 1265.
    tolerance: longForm && preset === 'standard' ? 0.10 : 0.15,
  };
}

/**
 * Remove structural noise before counting. We strip:
 *   - Code fences (``` blocks and their contents)
 *   - The trailing `---\nSources:\n…` block our post-processor appends
 *   - Markdown headings' leading `#` sigils (keep the words)
 *   - List markers at line start (`- `, `* `, `1. `)
 *   - Inline image / link syntax, keeping the visible text
 *   - Citation markers ([vault:uuid], [Source N], [N])
 * Then split on whitespace and filter empties.
 *
 * This is deliberately a heuristic, not a full markdown parser — we're
 * counting for "is this the right length?", not for typesetting.
 */
export function countWords(body: string): number {
  if (!body) return 0;
  let s = body;

  // Drop the Sources block our own post-processor appends. Match the
  // exact separator we emit so we don't eat content that happens to
  // contain the word "sources".
  s = s.replace(/\n\n?---\nSources:[\s\S]*$/i, '');

  // Drop fenced code blocks entirely — code rarely tracks the narrative
  // word count users care about, and counting backtick-heavy snippets
  // inflates the total.
  s = s.replace(/```[\s\S]*?```/g, ' ');

  // Citation markers — these are artefacts, not prose.
  s = s.replace(/\[vault:[0-9a-f-]{36}\]/gi, ' ');
  s = s.replace(/\[area:[a-z0-9-]+\]/gi, ' ');
  s = s.replace(/\[Source\s+\d+\]/gi, ' ');
  s = s.replace(/\[\d+\]/g, ' ');

  // Markdown syntax: keep the visible text.
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');   // images
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');    // links
  s = s.replace(/^#{1,6}\s+/gm, '');                // headings
  s = s.replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '');    // list markers
  s = s.replace(/[*_`~]+/g, '');                    // emphasis chars

  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Strip `#` markdown heading sigils from a body, promoting the heading
 * text to a bold line instead. Runs in the draft editor and the
 * copy/download paths so legacy drafts — generated before the Apr-2026
 * "no # headings" rule — render cleanly in downstream CMS surfaces.
 *
 * Rules:
 *   - `# Heading` → `**Heading**`  (single line, any H1–H6)
 *   - Orphan `#` / `##` / `###` tokens with no following word are dropped.
 *   - Inline `#` characters (hashtags, prices, section refs like "see §3")
 *     are NOT touched — only line-start heading sigils.
 */
export function stripHashHeadings(body: string): string {
  if (!body) return body;
  return body
    // Promote heading lines to bold — captures 1-6 hashes followed by
    // at least one space and non-empty text.
    .replace(/^[ \t]*#{1,6}[ \t]+(.+?)[ \t]*$/gm, '**$1**')
    // Drop orphan heading tokens left on their own line.
    .replace(/^[ \t]*#{1,6}[ \t]*$/gm, '')
    // Squash the double blank lines the orphan removal may leave behind.
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * True when `count` is outside the target ± tolerance. Returns a tuple
 * so callers can both decide and report.
 */
export function isOutsideTarget(
  count: number,
  t: WordTarget,
): { outside: boolean; direction: 'short' | 'long' | 'ok' } {
  const lo = Math.floor(t.min * (1 - t.tolerance));
  const hi = Math.ceil(t.max  * (1 + t.tolerance));
  if (count < lo) return { outside: true, direction: 'short' };
  if (count > hi) return { outside: true, direction: 'long' };
  return { outside: false, direction: 'ok' };
}

/**
 * Build a retry directive to append to the regen user prompt. Deliberately
 * concrete: the model performs far better with "aim for ~750 words" than
 * with "make it the right length".
 */
export function buildLengthRetryDirective(
  count: number,
  t: WordTarget,
  direction: 'short' | 'long',
): string {
  const target = Math.round((t.min + t.max) / 2);
  const verb = direction === 'short' ? 'expand' : 'tighten';
  return `Your previous draft was ${count} words — ${direction === 'short'
    ? `too short`
    : `too long`}. ${verb.charAt(0).toUpperCase()}${verb.slice(1)} to roughly ${target} words (range ${t.min}–${t.max}). Keep every vault citation; do not introduce new claims.`;
}
