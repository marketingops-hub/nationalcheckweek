/* ═══════════════════════════════════════════════════════════════════════════
 * Request-scoped logger for the Content Creator pipeline.
 *
 * Two artefacts exported:
 *
 *   - `newRequestId()`  — short hex correlation id, 10 chars.
 *   - `createLogger()`  — returns a Logger whose .info/.warn/.error prefix
 *                         every line with `[content-creator] [fn=<name>]
 *                         [req=<id>]`. Spans helper included.
 *
 * This is the src-side mirror of
 *   supabase/functions/_shared/content-creator/common.ts
 * (only the logging helpers, not the whole file). The parity test in
 * `__tests__/edge-fn-mirror.test.ts` enforces that the function bodies
 * stay identical, so keep both sides in sync.
 *
 * Why mirror instead of import: the edge fn is Deno with no bundler,
 * and shares nothing with the Next.js node-side module graph. The mirror
 * pattern is used across this codebase (see length.ts, density.ts).
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Prefix for every log line coming out of the content-creator stack.
 * Exported so `createLogger` can compose it with the request id and so
 * tests can assert on it without hard-coding a magic string.
 */
export const LOG_PREFIX = "[content-creator]";

/**
 * Generate a short, unique-enough request id for correlation across a
 * single edge-fn invocation. Not a full UUID — we don't need collision
 * resistance across all time, just "distinct within the Supabase log
 * window for this function". 10 hex chars gives ~1 in 10^12.
 *
 * Uses `crypto.getRandomValues` which Deno exposes on the global
 * `crypto` object (Web Crypto API). Falls back to `Math.random` if
 * crypto is unavailable (e.g. local unit test without a Deno runtime)
 * so the helper stays importable from node-side tests.
 */
export function newRequestId(): string {
  const g = (globalThis as { crypto?: Crypto }).crypto;
  if (g?.getRandomValues) {
    const bytes = new Uint8Array(5);
    g.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Node/test fallback — 10 hex chars, same length as the crypto path.
  return Math.floor(Math.random() * 0xffffffffff).toString(16).padStart(10, "0");
}

export interface Logger {
  info:  (...args: unknown[]) => void;
  warn:  (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  /** Timestamped span helper — returns the elapsed ms on `.end()`. */
  span:  (label: string) => { end: () => number };
  /** The request id this logger is bound to, exposed so handlers can
   *  include it in error responses for the admin to paste into
   *  Supabase log search. */
  requestId: string;
}

/**
 * Build a logger that prefixes every line with
 *   `[content-creator] [fn=<name>] [req=<id>] …`
 *
 * Using a single prefix format across every edge fn means Supabase logs
 * can be grepped with one regex (`req=<id>`) to trace a single admin
 * click across stage-2-generate, stage-3-verify, etc.
 */
export function createLogger(fnName: string, requestId = newRequestId()): Logger {
  const header = `${LOG_PREFIX} [fn=${fnName}] [req=${requestId}]`;
  return {
    requestId,
    info:  (...args) => console.log(header, ...args),
    warn:  (...args) => console.warn(header, ...args),
    error: (...args) => console.error(header, ...args),
    span:  (label: string) => {
      const start = Date.now();
      return {
        end: () => {
          const ms = Date.now() - start;
          console.log(`${header} span=${label} ms=${ms}`);
          return ms;
        },
      };
    },
  };
}
