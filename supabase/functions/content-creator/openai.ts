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
}

export interface OpenAIResult {
  content: string;   // raw JSON string (caller parses)
  model: string;
  tokens: { prompt: number; completion: number; total: number };
}

export async function callOpenAI(opts: OpenAIOpts): Promise<OpenAIResult> {
  const model = opts.model ?? "gpt-4o";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
  });

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
