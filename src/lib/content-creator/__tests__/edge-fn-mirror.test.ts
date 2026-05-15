/* ═══════════════════════════════════════════════════════════════════════════
 * Mirror-file parity contract.
 *
 * Several helpers live in two places:
 *
 *   src/lib/content-creator/<name>.ts                     (Node / browser)
 *   supabase/functions/_shared/content-creator/<name>.ts  (Deno edge fn)
 *
 * They can't import from each other — Next.js can't pull from a Deno
 * module and vice versa. The previous approach ("update them together")
 * is a reliability hole: the edge fn routinely shipped out of date with
 * the src/ copy during refactors, and neither tsc nor ESLint would say so.
 *
 * ── What this test does ────────────────────────────────────────────────────
 *
 * Reads both source files off disk and compares the *exported top-level
 * function bodies* textually (after normalising `.ts` import suffixes and
 * surrounding whitespace). We don't care if comments differ — only the
 * implementations must match. Any function listed in FUNCTIONS_TO_CHECK
 * that diverges makes the test fail with a diff.
 *
 * If you add a new shared helper, add its name to FUNCTIONS_TO_CHECK.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve }       from 'node:path';

/** Each entry identifies the src-side file, the edge-side file, and the
 *  set of exported function names whose bodies must match byte-for-byte
 *  after normalisation. Interfaces / types are NOT compared — TS changes
 *  legitimately differ (edge fn sometimes adds Deno-only annotations).
 *
 *  Most pairs are same-named, but the logger helpers are mirrored from
 *  `logger.ts` on the src side into `common.ts` on the edge side (the
 *  edge fn already has a common.ts with related utilities). */
const FUNCTIONS_TO_CHECK: Array<{
  srcFile:  string;
  edgeFile: string;
  fns:      string[];
}> = [
  { srcFile: 'length.ts',  edgeFile: 'length.ts',  fns: ['wordTarget', 'countWords', 'stripHashHeadings', 'isOutsideTarget', 'buildLengthRetryDirective'] },
  { srcFile: 'density.ts', edgeFile: 'density.ts', fns: ['densityTarget', 'evaluateDensity', 'densityPromptRule'] },
  { srcFile: 'styles.ts',  edgeFile: 'styles.ts',  fns: ['buildStyleExamplesBlock'] },
  { srcFile: 'logger.ts',  edgeFile: 'common.ts',  fns: ['newRequestId', 'createLogger'] },
];

/** Extract the source text of a single top-level `export function <name>`
 *  declaration from a file's raw contents.
 *
 *  Line-based rather than brace-walked: our files use `export function`
 *  at column zero and only one function per block, so we can reliably
 *  snip from the matching signature to the next top-level export or the
 *  end of the file. Avoids having to tokenise regex literals / template
 *  expression braces, which a naïve brace walker gets wrong.
 *
 *  Trailing `}` on its own line closes the body; we stop at the first
 *  such line after the signature. */
function extractFunction(source: string, name: string): string | null {
  const lines = source.split('\n');
  const signature = new RegExp(`^export\\s+function\\s+${name}\\b`);
  const start = lines.findIndex((l) => signature.test(l));
  if (start === -1) return null;

  // Walk until we see a line that is just `}` (possibly with trailing
  // whitespace) — that's the closing brace of the body in our code
  // style. Every shared helper in this repo matches that convention.
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\}\s*$/.test(lines[i])) {
      return lines.slice(start, i + 1).join('\n');
    }
  }
  return null;
}

/** Strip volatile bits so a legitimate comment change doesn't fail the
 *  test. We keep the bracket / operator / identifier content intact. */
function normalise(text: string): string {
  return text
    // Drop /* … */ block comments.
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Drop // line comments.
    .replace(/\/\/[^\n]*/g, '')
    // Collapse whitespace runs.
    .replace(/\s+/g, ' ')
    .trim();
}

const SRC_DIR  = resolve(process.cwd(), 'src/lib/content-creator');
const EDGE_DIR = resolve(process.cwd(), 'supabase/functions/_shared/content-creator');

for (const { srcFile, edgeFile, fns } of FUNCTIONS_TO_CHECK) {
  const label = srcFile === edgeFile ? srcFile : `${srcFile} ⇄ ${edgeFile}`;
  describe(`mirror parity — ${label}`, () => {
    const srcText  = readFileSync(resolve(SRC_DIR,  srcFile),  'utf-8');
    const edgeText = readFileSync(resolve(EDGE_DIR, edgeFile), 'utf-8');

    for (const fn of fns) {
      it(`${fn}() body matches edge-fn mirror`, () => {
        const srcFn  = extractFunction(srcText,  fn);
        const edgeFn = extractFunction(edgeText, fn);
        expect(srcFn, `missing export function ${fn} in src`).not.toBeNull();
        expect(edgeFn, `missing export function ${fn} in edge fn`).not.toBeNull();
        expect(normalise(edgeFn!)).toBe(normalise(srcFn!));
      });
    }
  });
}
