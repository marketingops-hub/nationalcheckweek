import { describe, it, expect } from 'vitest';
import {
  countWords, wordTarget, isOutsideTarget, buildLengthRetryDirective,
  stripHashHeadings,
} from '../length';

describe('countWords', () => {
  it('returns 0 for empty / whitespace input', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t ')).toBe(0);
  });

  it('counts plain prose', () => {
    expect(countWords('The quick brown fox jumps over the lazy dog.')).toBe(9);
  });

  it('strips headings and list markers', () => {
    const body = [
      '# Headline here',
      '',
      '## Section two',
      '',
      '- first bullet point',
      '- second bullet point',
      '1. numbered item',
    ].join('\n');
    // "Headline here" 2 + "Section two" 2 + "first bullet point" 3
    // + "second bullet point" 3 + "numbered item" 2 = 12
    expect(countWords(body)).toBe(12);
  });

  it('strips vault, [Source N] and [N] citation markers', () => {
    const body = 'A claim [vault:11111111-1111-1111-1111-111111111111] then another [Source 2] endcap.';
    // After stripping citations: "A claim then another endcap." = 5 words.
    expect(countWords(body)).toBe(5);
  });

  it('strips [area:<slug>] markers (GEO-page local-context citations)', () => {
    const body = 'Wagga Wagga has higher bullying rates [area:wagga-wagga] than the state average.';
    // After stripping: "Wagga Wagga has higher bullying rates than the state average." = 10 words.
    expect(countWords(body)).toBe(10);
  });

  it('drops the Sources block appended by formatCitations', () => {
    const body = [
      'Body paragraph one here.',
      'Body paragraph two here.',
      '',
      '---',
      'Sources:',
      '[1] Some title — https://example.com',
      '[2] Another title — https://example.org',
    ].join('\n');
    // Only the two body paragraphs count: 4 + 4 = 8
    expect(countWords(body)).toBe(8);
  });

  it('drops fenced code blocks', () => {
    const body = 'Intro sentence.\n\n```js\nconst a = 1;\nconst b = 2;\n```\n\nOutro.';
    // "Intro sentence." 2 + "Outro." 1 = 3
    expect(countWords(body)).toBe(3);
  });

  it('keeps link text and strips the URL', () => {
    const body = 'See [the report](https://example.com/report.pdf) for details.';
    // "See the report for details." = 5
    expect(countWords(body)).toBe(5);
  });
});

describe('wordTarget', () => {
  it('returns null for social regardless of preset', () => {
    expect(wordTarget('social')).toBeNull();
    expect(wordTarget('social', 'short')).toBeNull();
    expect(wordTarget('social', 'long')).toBeNull();
  });

  it('returns the baseline blog range when preset is standard / omitted', () => {
    // Apr-2026: blog baseline re-centred on 1000 words. Standard preset
    // gets a tighter ±10% tolerance so "standard blog = ~1000 words" is
    // actually enforced by the length gate.
    expect(wordTarget('blog')).toEqual({ min: 900, max: 1100, tolerance: 0.10 });
    expect(wordTarget('blog', 'standard')).toEqual({ min: 900, max: 1100, tolerance: 0.10 });
  });

  it('returns the baseline newsletter range when preset is standard / omitted', () => {
    expect(wordTarget('newsletter')).toEqual({ min: 300, max: 500, tolerance: 0.15 });
    expect(wordTarget('newsletter', 'standard')).toEqual({ min: 300, max: 500, tolerance: 0.15 });
  });

  it('scales blog down 0.6× for short', () => {
    // 900×0.6=540, 1100×0.6=660. Non-standard preset keeps the 0.15
    // tolerance — we only tightened the standard baseline.
    expect(wordTarget('blog', 'short')).toEqual({ min: 540, max: 660, tolerance: 0.15 });
  });

  it('scales blog up 1.6× for long', () => {
    // 900×1.6=1440, 1100×1.6=1760.
    expect(wordTarget('blog', 'long')).toEqual({ min: 1440, max: 1760, tolerance: 0.15 });
  });

  it('scales newsletter proportionally', () => {
    expect(wordTarget('newsletter', 'short')).toEqual({ min: 180, max: 300, tolerance: 0.15 });
    expect(wordTarget('newsletter', 'long')).toEqual({ min: 480, max: 800, tolerance: 0.15 });
  });

  it('treats geo like blog — 1000-word baseline, same tolerance curve', () => {
    // GEO pages share the 900–1100 baseline and the tighter 0.10 tolerance
    // on standard so the "Wagga × Bullying" article lands near 1000 words.
    expect(wordTarget('geo')).toEqual({ min: 900, max: 1100, tolerance: 0.10 });
    expect(wordTarget('geo', 'short')).toEqual({ min: 540, max: 660, tolerance: 0.15 });
    expect(wordTarget('geo', 'long')).toEqual({ min: 1440, max: 1760, tolerance: 0.15 });
  });

  it('tolerance is 0.10 on standard blog, 0.15 elsewhere', () => {
    // Standard-blog is the one case where we tighten tolerance: admin
    // asked for "exactly ~1000 words", so we don't want the gate to
    // quietly accept a 1265-word draft. Other presets/types stay at
    // the historical 0.15 so we don't churn newsletters unnecessarily.
    expect(wordTarget('blog',       'standard')?.tolerance).toBe(0.10);
    expect(wordTarget('blog',       'short')?.tolerance).toBe(0.15);
    expect(wordTarget('blog',       'long')?.tolerance).toBe(0.15);
    expect(wordTarget('newsletter', 'standard')?.tolerance).toBe(0.15);
  });
});

describe('stripHashHeadings', () => {
  it('returns the input unchanged when there are no headings', () => {
    const body = 'Regular paragraph.\n\nAnother one — no sigils here.';
    expect(stripHashHeadings(body)).toBe(body);
  });

  it('promotes single-# headings to bold lines', () => {
    expect(stripHashHeadings('# Top heading')).toBe('**Top heading**');
  });

  it('handles H1 through H6 identically', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const prefix = '#'.repeat(n);
      expect(stripHashHeadings(`${prefix} Section`)).toBe('**Section**');
    }
  });

  it('drops orphan heading tokens (`#` alone on a line)', () => {
    expect(stripHashHeadings('Para.\n###\nMore text.'))
      .toBe('Para.\n\nMore text.');
  });

  it('leaves inline # characters alone (hashtags, refs)', () => {
    const body = 'See #mentalhealth for context. Prices from $#NZD.';
    expect(stripHashHeadings(body)).toBe(body);
  });

  it('does not touch # that sits after leading whitespace-and-word chars', () => {
    // A line starting with a word, then a #, must not be treated as a heading.
    const body = 'note: # is used as a sigil.';
    expect(stripHashHeadings(body)).toBe(body);
  });

  it('handles empty / nullish input safely', () => {
    expect(stripHashHeadings('')).toBe('');
  });

  it('collapses the triple-newlines that orphan removal could leave', () => {
    const out = stripHashHeadings('A\n\n##\n\nB');
    expect(out).toBe('A\n\nB');
  });

  it('is idempotent — running it twice is a no-op', () => {
    const input = '# Heading\n\nPara.\n## Sub\nMore.';
    const once  = stripHashHeadings(input);
    expect(stripHashHeadings(once)).toBe(once);
  });
});

describe('isOutsideTarget', () => {
  const t = { min: 600, max: 900, tolerance: 0.15 };

  it('accepts the midpoint', () => {
    expect(isOutsideTarget(750, t)).toEqual({ outside: false, direction: 'ok' });
  });

  it('accepts counts within the tolerance band', () => {
    // lo = floor(600 * 0.85) = 510; hi = ceil(900 * 1.15) = 1035
    expect(isOutsideTarget(520, t).outside).toBe(false);
    expect(isOutsideTarget(1030, t).outside).toBe(false);
  });

  it('flags short drafts', () => {
    expect(isOutsideTarget(400, t)).toEqual({ outside: true, direction: 'short' });
  });

  it('flags long drafts', () => {
    expect(isOutsideTarget(1200, t)).toEqual({ outside: true, direction: 'long' });
  });
});

describe('buildLengthRetryDirective', () => {
  const t = { min: 600, max: 900, tolerance: 0.15 };

  it('produces a concrete short-direction directive', () => {
    const d = buildLengthRetryDirective(300, t, 'short');
    expect(d).toContain('300 words');
    expect(d).toContain('too short');
    expect(d).toContain('Expand');
    expect(d).toContain('750');      // midpoint
    expect(d).toContain('600–900');
  });

  it('produces a concrete long-direction directive', () => {
    const d = buildLengthRetryDirective(1400, t, 'long');
    expect(d).toContain('1400 words');
    expect(d).toContain('too long');
    expect(d).toContain('Tighten');
  });
});
