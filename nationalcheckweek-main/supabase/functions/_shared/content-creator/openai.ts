/* ═══════════════════════════════════════════════════════════════════════════
 * OpenAI wrapper for the Content Creator edge function.
 *
 * Thin fetch-based client (no SDK) so we control the Deno bundle size. Always
 * requests JSON-mode. Throws on non-2xx so the caller can fall back to
 * Anthropic.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface OpenAIOpts {
  apiKey: string;
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Per-call fetch timeout. Default 60s — tuned so the AI chain (up
   *  to 2x OpenAI draft passes + 1x Anthropic improve) fits inside
   *  Supabase's ~150s edge-fn wall-clock cap with room to spare. A
   *  slow-upstream timeout here throws AbortError which the caller's
   *  try/catch handles, letting us reset the row's status. Without
   *  this the fetch hangs and Supabase SIGKILLs the whole worker,
   *  leaving content_drafts stranded at status='generating'. */
  timeoutMs?: number;
}

export interface OpenAIResult {
  content: string;   // raw JSON string (caller parses)
  model: string;
  tokens: { prompt: number; completion: number; total: number };
}

export async function callOpenAI(opts: OpenAIOpts): Promise<OpenAIResult> {
  const model = opts.model ?? "gpt-4o";
  const timeoutMs = opts.timeoutMs ?? 60_000;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: opts.temperature ?? 0.5,
        max_tokens: opts.maxTokens ?? 2000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.system },
          { role: "user",   content: opts.user   },
        ],
      }),
      // AbortSignal.timeout throws a catchable AbortError at the budget.
      // See OpenAIOpts.timeoutMs for why this is critical for edge-fn
      // cleanup hygiene.
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error(`OpenAI timed out after ${timeoutMs}ms`);
    }
    throw err;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 500)}`);
  }

  const data = await res.json() as {
    choices: { message: { content: string } }[];
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    model: string;
  };

  return {
    content: data.choices[0]?.message?.content ?? "",
    model: data.model,
    tokens: {
      prompt:     data.usage.prompt_tokens,
      completion: data.usage.completion_tokens,
      total:      data.usage.total_tokens,
    },
  };
}
