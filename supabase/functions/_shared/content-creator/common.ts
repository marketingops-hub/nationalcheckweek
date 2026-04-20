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
