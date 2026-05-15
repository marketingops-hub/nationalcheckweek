/* ═══════════════════════════════════════════════════════════════════════════
 * Tests for the Claude-friendly JSON salvage used by every content-creator
 * edge function. These cases are drawn from real model failures observed
 * in production logs — protect against regressions in `repairJson` and
 * `safeParseJson`, which are the difference between "pipeline degrades
 * gracefully" and "admin sees 500".
 * ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect } from 'vitest';
import { repairJson, safeParseJson } from '../json';

describe('repairJson', () => {
  it('passes through already-valid JSON unchanged', () => {
    const input = '{"title":"Hello","body":"No problems here"}';
    expect(repairJson(input)).toBe(input);
  });

  it('strips ```json fences', () => {
    const raw = '```json\n{"body":"hello"}\n```';
    expect(JSON.parse(repairJson(raw))).toEqual({ body: 'hello' });
  });

  it('strips plain ``` fences without the json tag', () => {
    const raw = '```\n{"body":"hi"}\n```';
    expect(JSON.parse(repairJson(raw))).toEqual({ body: 'hi' });
  });

  it('re-escapes an unescaped inner quote in a body field', () => {
    // This is the canonical failure: Claude writes "So-called "soft skills"."
    const raw = '{"body": "So-called "soft skills" matter."}';
    const fixed = repairJson(raw);
    expect(JSON.parse(fixed)).toEqual({
      body: 'So-called "soft skills" matter.',
    });
  });

  it('handles multiple long-prose fields in one payload', () => {
    const raw = `{"title": "The "big" idea","body": "It "really" works","notes": "ok"}`;
    const parsed = JSON.parse(repairJson(raw));
    expect(parsed.title).toBe('The "big" idea');
    expect(parsed.body).toBe('It "really" works');
    expect(parsed.notes).toBe('ok');
  });

  it('does not touch fields that are not in the long-prose list', () => {
    // `foo` is not a known prose key — it should NOT have quotes re-escaped.
    // Instead, repairJson leaves it alone and JSON.parse will still fail
    // (which is the contract: we only fix known shapes).
    const raw = '{"foo": "weird "quote" here"}';
    expect(() => JSON.parse(repairJson(raw))).toThrow();
  });

  it('leaves correctly-escaped quotes untouched', () => {
    const raw = '{"body": "Already \\"quoted\\" fine"}';
    expect(JSON.parse(repairJson(raw))).toEqual({
      body: 'Already "quoted" fine',
    });
  });

  it('handles nested arrays of objects with prose fields', () => {
    const raw =
      '{"ideas":[{"title":"A","summary":"One"},{"title":"B","summary":"Two"}]}';
    expect(JSON.parse(repairJson(raw))).toEqual({
      ideas: [
        { title: 'A', summary: 'One' },
        { title: 'B', summary: 'Two' },
      ],
    });
  });

  it('repairs a claim inside a flagged_claims array', () => {
    const raw =
      '{"flagged_claims":[{"claim": "The "latest" data","reason":"no vault backing"}]}';
    expect(JSON.parse(repairJson(raw))).toEqual({
      flagged_claims: [
        { claim: 'The "latest" data', reason: 'no vault backing' },
      ],
    });
  });

  it('preserves newlines inside prose strings', () => {
    const raw = '{"body": "line one\\nline two"}';
    expect(JSON.parse(repairJson(raw))).toEqual({ body: 'line one\nline two' });
  });

  it('returns garbage unchanged if the shape is unfixable', () => {
    // Truncation / random chars — we have no magic for this.
    const raw = '{"body": "half a thought';
    // repairJson shouldn't throw — it just returns something that still fails parse.
    expect(() => JSON.parse(repairJson(raw))).toThrow();
  });
});

describe('safeParseJson', () => {
  it('returns the parsed object for valid input', () => {
    expect(safeParseJson<{ a: number }>('{"a":1}', 'test')).toEqual({ a: 1 });
  });

  it('recovers on the repair pass', () => {
    const raw = '```json\n{"body": "The "real" thing"}\n```';
    expect(safeParseJson<{ body: string }>(raw, 'claude improve')).toEqual({
      body: 'The "real" thing',
    });
  });

  it('throws a labelled error with preview when both passes fail', () => {
    expect(() => safeParseJson('not json at all', 'openai ideas')).toThrow(
      /openai ideas returned invalid JSON:.*Preview: not json at all/,
    );
  });

  it('caps the preview at 200 characters', () => {
    const huge = 'x'.repeat(500);
    try {
      safeParseJson(huge, 'test');
      throw new Error('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      // The Preview: section contains the first 200 chars of `huge`.
      const preview = msg.split('Preview: ')[1] ?? '';
      expect(preview.length).toBe(200);
    }
  });

  it('collapses whitespace in the preview for readable logs', () => {
    try {
      safeParseJson('bad\n\n\tjson\n\nhere', 'test');
    } catch (e) {
      expect((e as Error).message).toContain('Preview: bad json here');
    }
  });
});
