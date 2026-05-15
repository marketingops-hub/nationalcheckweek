/* ═══════════════════════════════════════════════════════════════════════════
 * Evidence-density helpers.
 *
 * The generate pipeline prompts the model to cite the Vault inline with
 * [vault:<uuid>] markers. "Cite the vault" without a quantity target turns
 * into the classic failure mode where a 900-word blog has 2 citations
 * wedged into the intro and pure prose everywhere else. The verifier then
 * passes the two correct citations and misses that the other 850 words
 * are unsubstantiated.
 *
 * This module:
 *
 *   1. Declares a per-content-type target (words-per-citation).
 *   2. Computes the actual density from a body + ordered_vault_ids list.
 *   3. Emits a human-readable drift warning when the density is below
 *      target, for the MetaPanel.
 *   4. Produces a prompt snippet that the generate + verify builders can
 *      embed so the model and the verifier share a single source of truth.
 *
 * Social posts get a looser rule (optional — at least one cite per post)
 * because a 30-char tweet has no room for four separate citations.
 *
 * IMPORTANT: this file is mirrored at
 *   src/lib/content-creator/density.ts
 * because Deno edge fns can't import from `src/`. Keep them in sync.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface DensityTarget {
  /**
   * Target words-per-citation. Blog aims for one vault cite per 150 words,
   * newsletter for one per 100 — newsletters are shorter and lean harder
   * on evidence to justify the reader's attention.
   */
  wordsPerCite: number;

  /**
   * Minimum absolute citations regardless of length. Short drafts that
   * squeak under the word-count floor still need at least this many or
   * the model has effectively produced un-sourced prose.
   */
  minCites: number;

  /** Tolerance band on wordsPerCite. density > target * (1 + tol) trips. */
  tolerance: number;
}

/** Mirror of the language in prompts.ts · typeSpecificRules. Update both. */
export function densityTarget(
  content_type: 'social' | 'blog' | 'newsletter' | 'geo',
): DensityTarget | null {
  // GEO shares the blog profile — long-form, same ~150 words/cite rule.
  if (content_type === 'blog' || content_type === 'geo') return { wordsPerCite: 150, minCites: 3, tolerance: 0.25 };
  if (content_type === 'newsletter') return { wordsPerCite: 100, minCites: 2, tolerance: 0.25 };
  // Social: at least 1 citation per post, but we don't density-check.
  return null;
}

export interface DensityReport {
  /** Words in the post-processed body (call with the same `countWords` input). */
  words: number;
  /** How many distinct vault ids ended up cited. */
  cites: number;
  /** words / cites. Infinity when cites === 0. */
  wordsPerCite: number;
  /** True when density is outside the target ± tolerance OR cites < minCites. */
  belowTarget: boolean;
  /** Human-readable explanation for the MetaPanel. "" when within target. */
  warning: string;
}

/**
 * Evaluate density against the target for this content type.
 * `content_type === 'social'` returns a report with belowTarget=false and
 * no warning (social posts aren't density-gated) so callers can always
 * call this and decide per-return.
 */
export function evaluateDensity(
  content_type: 'social' | 'blog' | 'newsletter' | 'geo',
  words: number,
  cites: number,
): DensityReport {
  const t = densityTarget(content_type);
  const wpc = cites === 0 ? Infinity : words / cites;

  if (!t) {
    return { words, cites, wordsPerCite: wpc, belowTarget: false, warning: '' };
  }

  const ceiling = t.wordsPerCite * (1 + t.tolerance);

  if (cites < t.minCites) {
    return {
      words, cites, wordsPerCite: wpc, belowTarget: true,
      warning: `Only ${cites} citation${cites === 1 ? '' : 's'} in ${words} words — ${content_type} posts need at least ${t.minCites}. Add vault-backed evidence or tighten the copy.`,
    };
  }

  if (wpc > ceiling) {
    // e.g. blog with 900 words + 3 cites → 300 wpc vs target 150 → breach
    return {
      words, cites, wordsPerCite: wpc, belowTarget: true,
      warning: `Evidence density is low: 1 citation per ${Math.round(wpc)} words (target ≤${t.wordsPerCite}). Add ${Math.ceil(words / t.wordsPerCite) - cites} more vault-backed cite(s) or trim filler.`,
    };
  }

  return { words, cites, wordsPerCite: wpc, belowTarget: false, warning: '' };
}

/**
 * Prompt snippet emitted into the system message for both generate and
 * verify stages. Centralised here so updating the rule in one place
 * updates what the writer AND the verifier see.
 */
export function densityPromptRule(content_type: 'social' | 'blog' | 'newsletter' | 'geo'): string {
  const t = densityTarget(content_type);
  if (!t) {
    // Social: one citation per post is enough; don't ask for more.
    return `- Cite at least one VAULT entry in the body. More than 2 rarely fits inside the character budget.`;
  }
  return `- Evidence density: cite at least one VAULT entry every ~${t.wordsPerCite} words, and at least ${t.minCites} unique vault ids in total. Distribute cites across paragraphs; do not cluster them in the intro.`;
}
