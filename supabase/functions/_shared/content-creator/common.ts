/* ═══════════════════════════════════════════════════════════════════════════
 * Shared helpers for every content-creator-* edge function.
 *
 * The monolithic `content-creator` function has been split into four
 * single-purpose deploys:
 *
 *   content-creator-topics    → Stage 0 (Vault → topic backlog)
 *   content-creator-ideas     → Stage 1 (brief → N idea rows)
 *   content-creator-generate  → Stage 2 (idea → OpenAI draft → Anthropic improve)
 *   content-creator-verify    → Stage 3 (draft → Anthropic verdict)
 *
 * This file collects everything they have in common: CORS, auth, env
 * wiring, JSON helpers, and the `Ctx` type. Anything stage-specific lives
 * in the caller.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export interface Ctx {
  sbUrl: string;
  sbKey: string;
  openaiKey?: string;
  anthropicKey?: string;
}

/** Standard JSON response with CORS headers baked in. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Validate that every required env var is present. Returns Ctx on success,
 * a 500 Response on failure. We check here rather than in each handler so
 * misconfiguration surfaces before any DB or AI calls are made.
 */
export function readCtx(opts: { requireOpenAI?: boolean; requireAnthropic?: boolean } = {}): Ctx | Response {
  const sbUrl = Deno.env.get("SUPABASE_URL");
  const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiKey    = Deno.env.get("OPENAI_API_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  const missing: string[] = [];
  if (!sbUrl) missing.push("SUPABASE_URL");
  if (!sbKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (opts.requireOpenAI    && !openaiKey)    missing.push("OPENAI_API_KEY");
  if (opts.requireAnthropic && !anthropicKey) missing.push("ANTHROPIC_API_KEY");

  if (missing.length > 0) {
    return json({ error: `Missing env: ${missing.join(", ")}` }, 500);
  }

  return { sbUrl: sbUrl!, sbKey: sbKey!, openaiKey, anthropicKey };
}

/**
 * Parse JSON with Claude-friendly repair fallback.
 *
 * Implementation is kept inline (rather than imported from `src/lib`) so
 * edge functions don't need a bundler — Deno imports only URLs or relative
 * paths. The behaviour is mirrored 1:1 by `src/lib/content-creator/json.ts`
 * which has a full unit test suite. If you edit this, port the change over
 * and re-run `vitest run src/lib/content-creator`.
 */
export function safeParseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(repairJson(raw)) as T;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const preview = raw.slice(0, 200).replace(/\s+/g, " ");
      throw new Error(`${label} returned invalid JSON: ${msg}. Preview: ${preview}`);
    }
  }
}

/** See `src/lib/content-creator/json.ts` for the canonical documented version + tests. */
export function repairJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  s = s.replace(
    /("(?:title|body|notes|angle|rationale|claim|reason|suggested_fix|summary|source)"\s*:\s*")([\s\S]*?)("\s*(?:,|\n\s*[}\]]|\s*[}\]]))/g,
    (_m, open, inner, close) => {
      const fixed = inner.replace(/(?<!\\)"/g, '\\"');
      return open + fixed + close;
    },
  );
  return s;
}

/** Dedup + filter a UUID array, dropping anything non-stringy or empty. */
export function dedupUuids(arr: string[]): string[] {
  return Array.from(new Set(arr.filter((v) => typeof v === "string" && v.length > 0)));
}

/** Dedup + trim a free-text array. Used for keyword arrays coming from AI. */
export function dedupStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    const t = (v ?? "").toString().trim();
    if (t.length > 0 && t.length <= 80 && !seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out;
}

/** Enforce a max length + trim on AI-provided strings. */
export function trim(s: string, max: number): string {
  return (s ?? "").toString().trim().slice(0, max);
}

/**
 * Strip stale `last_error_*` keys from an ai_metadata blob.
 *
 * Every stage writes `last_error / last_error_at / last_error_stage /
 * last_error_request_id` in its failure branch. Without this helper,
 * successful runs spread the prior metadata into the new row and the
 * stale error sticks around in the Provenance card forever — confusing
 * admins who ran Generate three times and see a two-week-old error on
 * a perfectly good draft.
 *
 * Call this on the metadata object *before* spreading it into the
 * success-path update.
 */
export function clearLastError<T extends Record<string, unknown>>(meta: T | null | undefined): T {
  const base = { ...(meta ?? {}) } as Record<string, unknown>;
  delete base.last_error;
  delete base.last_error_at;
  delete base.last_error_stage;
  delete base.last_error_request_id;
  return base as T;
}

/**
 * Shared auth gate. Every content-creator-* fn is called by a Next.js API
 * route that forwards the service-role key as `Authorization`, so we just
 * assert the header exists (Supabase already verifies the key).
 */
export function requireAuth(req: Request): Response | null {
  if (!req.headers.get("Authorization")) {
    return json({ error: "Missing Authorization header." }, 401);
  }
  return null;
}

/* ─── Request-scoped logging ────────────────────────────────────────────── */

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
