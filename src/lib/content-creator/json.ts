/* ═══════════════════════════════════════════════════════════════════════════
 * Robust JSON parsing for AI outputs.
 *
 * LLMs — Claude especially — will occasionally emit "almost valid" JSON:
 *   - wrapped in a ```json fence
 *   - with an unescaped double quote inside a long-prose string
 *   - with a stray leading / trailing newline
 *
 * Rather than retry the whole AI call (costly + slow), we do one targeted
 * repair pass and only then give up. This module is shared between:
 *   - The Deno edge functions (`_shared/content-creator/common.ts` re-exports)
 *   - Any future server-side or client-side JSON parsing that touches AI text.
 *
 * The regex lookbehind `(?<!\\)` requires ES2018+ (Node 10+, Deno, modern
 * browsers). Safe for every runtime we ship to.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Long-prose string field names that appear in our prompts' response schemas.
 * Only inner unescaped quotes in these fields are re-escaped — we don't want
 * to clobber JSON syntax characters anywhere else.
 *
 * Keep this list loose: if a new prompt introduces a prose field, add it.
 */
const LONG_PROSE_FIELDS = [
  'title', 'body', 'notes', 'angle', 'rationale',
  'claim', 'reason', 'suggested_fix', 'summary', 'source',
];

/**
 * Best-effort JSON repair. Conservative — only two fixes:
 *   1. Strip ```json ... ``` fences.
 *   2. Re-escape bare `"` chars inside a known set of long-prose string values.
 *
 * If the damage is elsewhere (bad keys, trailing commas, truncation) the
 * caller's second `JSON.parse` will still throw, which is what we want.
 */
export function repairJson(raw: string): string {
  let s = raw.trim();

  // 1. Strip fence markers. Claude sometimes ignores "JSON only" instructions.
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // 2. For each `"field": "…"` where field is a long-prose key, re-escape
  //    any unescaped " inside the value. We terminate on `"` followed by
  //    `,` or whitespace+`}` / `]` which is the only shape JSON allows.
  const fieldAlt = LONG_PROSE_FIELDS.join('|');
  const re = new RegExp(
    `("(?:${fieldAlt})"\\s*:\\s*")([\\s\\S]*?)("\\s*(?:,|\\n\\s*[}\\]]|\\s*[}\\]]))`,
    'g',
  );
  s = s.replace(re, (_match, open: string, inner: string, close: string) => {
    const fixed = inner.replace(/(?<!\\)"/g, '\\"');
    return open + fixed + close;
  });

  return s;
}

/**
 * Parse JSON with one targeted repair retry.
 *
 * @param raw   The AI-produced text (may contain fences / bad escapes).
 * @param label A short label for the error message — surfaces in logs as
 *              e.g. "openai ideas returned invalid JSON: …".
 *
 * @throws Error with a 200-char preview of `raw` if both parse attempts fail.
 */
export function safeParseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(repairJson(raw)) as T;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const preview = raw.slice(0, 200).replace(/\s+/g, ' ');
      throw new Error(`${label} returned invalid JSON: ${msg}. Preview: ${preview}`);
    }
  }
}
