/* ═══════════════════════════════════════════════════════════════════════════
 * Anthropic wrapper for the Content Creator edge function.
 *
 * Used for:
 *   • Improvement pass on top of the OpenAI draft (stage 2b).
 *   • Full verification pass against the vault (stage 3).
 *
 * Always asks Claude to return a single JSON object. The caller extracts and
 * parses it — if Claude wraps it in prose, we grep the first {...} block.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface AnthropicOpts {
  apiKey: string;
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Per-call fetch timeout. Default 60s. See ../openai.ts::OpenAIOpts
   *  for the full rationale — TL;DR: without this the edge-fn worker
   *  gets SIGKILL'd at Supabase's 150s cap when upstream stalls, and
   *  the row is left stranded at status='generating'|'verifying'. */
  timeoutMs?: number;
}

export interface AnthropicResult {
  content: string;   // raw JSON string (caller parses)
  model: string;
  tokens: { prompt: number; completion: number; total: number };
}

export async function callAnthropic(opts: AnthropicOpts): Promise<AnthropicResult> {
  // Claude Sonnet 4.5 — current flagship as of 2025-09-29. The previous
  // default (claude-3-5-sonnet-20241022) was retired by Anthropic and
  // started returning 404 "not_found_error".
  const model = opts.model ?? "claude-sonnet-4-5-20250929";
  const timeoutMs = opts.timeoutMs ?? 60_000;

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         opts.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: opts.system,
        max_tokens: opts.maxTokens ?? 2000,
        temperature: opts.temperature ?? 0.3,
        messages: [{ role: "user", content: opts.user }],
      }),
      // AbortSignal.timeout throws a catchable AbortError — without it
      // Supabase SIGKILLs the worker at its wall-clock cap and the
      // caller's cleanup try/catch never runs.
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error(`Anthropic timed out after ${timeoutMs}ms`);
    }
    throw err;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 500)}`);
  }

  const data = await res.json() as {
    content: { type: string; text: string }[];
    model: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    content: extractJson(text),
    model: data.model,
    tokens: {
      prompt:     data.usage.input_tokens,
      completion: data.usage.output_tokens,
      total:      data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

/**
 * Claude occasionally wraps JSON in markdown fences or prose even when asked
 * for strict JSON. Grab the first {...} block to be safe.
 */
function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const start = trimmed.indexOf("{");
  const end   = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  // Give up — let the caller JSON.parse and throw.
  return trimmed;
}
