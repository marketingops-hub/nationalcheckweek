/* ═══════════════════════════════════════════════════════════════════════════
 * Evidence-density helper.
 *
 * Covers the three branches the generate edge fn relies on:
 *   1. Social  → never density-gated; belowTarget is always false.
 *   2. Blog / newsletter with ≥ target density → passes.
 *   3. Blog / newsletter below target (either by minCites OR by wpc
 *      exceeding target * (1 + tolerance)) → flagged with a specific
 *      warning string the MetaPanel renders verbatim.
 *
 * We do NOT snapshot the exact warning wording — it's UX copy, not
 * contract — but we DO assert it references the real shortfall (cite
 * count, target wpc) so callers can trust the guidance.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect } from 'vitest';
import { densityTarget, evaluateDensity, densityPromptRule } from '../density';

describe('densityTarget', () => {
  it('returns null for social (no density gate)', () => {
    expect(densityTarget('social')).toBeNull();
  });

  it('returns stricter wpc for newsletter than blog', () => {
    const blog       = densityTarget('blog')!;
    const newsletter = densityTarget('newsletter')!;
    expect(newsletter.wordsPerCite).toBeLessThan(blog.wordsPerCite);
  });
});

describe('evaluateDensity — social', () => {
  it('is never belowTarget regardless of cite count', () => {
    const noCites = evaluateDensity('social', 60, 0);
    expect(noCites.belowTarget).toBe(false);
    expect(noCites.warning).toBe('');

    const manyCites = evaluateDensity('social', 60, 4);
    expect(manyCites.belowTarget).toBe(false);
  });
});

describe('evaluateDensity — long-form', () => {
  it('passes a healthy blog: 750 words / 5 cites → 150 wpc = target', () => {
    const r = evaluateDensity('blog', 750, 5);
    expect(r.belowTarget).toBe(false);
    expect(r.warning).toBe('');
    expect(r.wordsPerCite).toBe(150);
  });

  it('passes just inside tolerance (target × 1.25 boundary)', () => {
    // Blog target 150 × 1.25 = 187.5 → 750 / 4 = 187.5 must pass.
    const r = evaluateDensity('blog', 750, 4);
    expect(r.belowTarget).toBe(false);
  });

  it('fails just outside tolerance', () => {
    // 800 / 4 = 200 wpc > 187.5 ceiling → flag.
    const r = evaluateDensity('blog', 800, 4);
    expect(r.belowTarget).toBe(true);
    expect(r.warning).toMatch(/density is low/i);
    // Warning must reference the actual target so the admin knows where to aim.
    expect(r.warning).toContain('150');
  });

  it('fails when below minCites even if wpc would be within tolerance', () => {
    // Tiny 100-word blog with 1 cite → wpc 100 looks great, but minCites=3.
    const r = evaluateDensity('blog', 100, 1);
    expect(r.belowTarget).toBe(true);
    expect(r.warning).toMatch(/at least 3/);
  });

  it('fails with zero citations (infinite wpc)', () => {
    const r = evaluateDensity('newsletter', 400, 0);
    expect(r.belowTarget).toBe(true);
    expect(r.wordsPerCite).toBe(Infinity);
  });

  it('uses singular copy for a single citation', () => {
    // Matches the `s ? '' : 's'` branch in the warning template.
    const r = evaluateDensity('blog', 100, 1);
    expect(r.warning).toContain('1 citation ');
    expect(r.warning).not.toContain('1 citations');
  });
});

describe('densityPromptRule', () => {
  it('emits a loose single-cite rule for social', () => {
    const rule = densityPromptRule('social');
    expect(rule).toMatch(/at least one/i);
    // Social explicitly does NOT mention a words-per-cite target.
    expect(rule).not.toMatch(/every ~\d+ words/);
  });

  it('emits a words-per-cite + minCites rule for long-form', () => {
    const blog = densityPromptRule('blog');
    expect(blog).toMatch(/every ~150 words/);
    expect(blog).toMatch(/at least 3 unique/);

    const news = densityPromptRule('newsletter');
    expect(news).toMatch(/every ~100 words/);
    expect(news).toMatch(/at least 2 unique/);
  });
});
