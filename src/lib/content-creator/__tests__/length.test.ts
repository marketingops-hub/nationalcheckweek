import { describe, it, expect } from 'vitest';
import {
  countWords, wordTarget, isOutsideTarget, buildLengthRetryDirective,
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
    expect(wordTarget('blog')).toEqual({ min: 600, max: 900, tolerance: 0.15 });
    expect(wordTarget('blog', 'standard')).toEqual({ min: 600, max: 900, tolerance: 0.15 });
  });

  it('returns the baseline newsletter range when preset is standard / omitted', () => {
    expect(wordTarget('newsletter')).toEqual({ min: 300, max: 500, tolerance: 0.15 });
    expect(wordTarget('newsletter', 'standard')).toEqual({ min: 300, max: 500, tolerance: 0.15 });
  });

  it('scales blog down 0.6× for short', () => {
    // 600×0.6=360, 900×0.6=540. Math.round applied explicitly.
    expect(wordTarget('blog', 'short')).toEqual({ min: 360, max: 540, tolerance: 0.15 });
  });

  it('scales blog up 1.6× for long', () => {
    // 600×1.6=960, 900×1.6=1440.
    expect(wordTarget('blog', 'long')).toEqual({ min: 960, max: 1440, tolerance: 0.15 });
  });

  it('scales newsletter proportionally', () => {
    expect(wordTarget('newsletter', 'short')).toEqual({ min: 180, max: 300, tolerance: 0.15 });
    expect(wordTarget('newsletter', 'long')).toEqual({ min: 480, max: 800, tolerance: 0.15 });
  });

  it('tolerance stays at 0.15 across all presets', () => {
    // If we ever scale tolerance per preset the length-gate retry logic
    // has to change too — this test guards that coupling.
    for (const p of ['short', 'standard', 'long'] as const) {
      expect(wordTarget('blog', p)?.tolerance).toBe(0.15);
    }
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
