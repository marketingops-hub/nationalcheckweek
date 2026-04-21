/* ═══════════════════════════════════════════════════════════════════════════
 * Token → USD cost estimator for the content-creator stages.
 *
 * Data source: published per-1M-token rates as of Apr 2026. These are
 * estimates, not billing-accurate — Anthropic and OpenAI both bill per
 * model version and sometimes apply batch/cache discounts we don't see
 * from the edge fn. Accuracy target: within 10% of the invoice.
 *
 * Why embed the table rather than hit a pricing API?
 *   - Neither provider offers one.
 *   - Pricing rarely changes; when it does we update this table.
 *   - Keeps the edge fn zero-dep for cost calc (no extra HTTP).
 *
 * When a model isn't in the table we return null for that leg and the
 * caller renders "—" in the UI. Better than a fake number.
 *
 * IMPORTANT: this file is mirrored at
 *   src/lib/content-creator/pricing.ts
 * because Deno edge fns can't import from `src/`. Keep them in sync.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface ModelPrice {
  /** USD per 1,000,000 prompt (input) tokens. */
  inputPer1M:  number;
  /** USD per 1,000,000 completion (output) tokens. */
  outputPer1M: number;
}

/** Published rates per 1M tokens, normalized to a single map keyed by the
 *  model string the providers actually return. Use lowercase keys; the
 *  lookup normalises the incoming model id the same way. */
const PRICES: Record<string, ModelPrice> = {
  // OpenAI
  'gpt-4o':            { inputPer1M: 2.50,  outputPer1M: 10.00 },
  'gpt-4o-mini':       { inputPer1M: 0.15,  outputPer1M: 0.60  },
  'gpt-4-turbo':       { inputPer1M: 10.00, outputPer1M: 30.00 },
  'gpt-4.1':           { inputPer1M: 2.00,  outputPer1M: 8.00  },
  'gpt-4.1-mini':      { inputPer1M: 0.40,  outputPer1M: 1.60  },

  // Anthropic
  'claude-3-5-sonnet-20241022': { inputPer1M: 3.00,  outputPer1M: 15.00 },
  'claude-3-5-sonnet-latest':   { inputPer1M: 3.00,  outputPer1M: 15.00 },
  'claude-3-5-haiku-20241022':  { inputPer1M: 0.80,  outputPer1M: 4.00  },
  'claude-3-opus-20240229':     { inputPer1M: 15.00, outputPer1M: 75.00 },
  'claude-3-sonnet-20240229':   { inputPer1M: 3.00,  outputPer1M: 15.00 },

  // Embeddings (retrieval)
  'text-embedding-3-small': { inputPer1M: 0.02, outputPer1M: 0 },
  'text-embedding-3-large': { inputPer1M: 0.13, outputPer1M: 0 },
};

/** Normalise a model id to the key shape we store (lowercase, no whitespace). */
function norm(model: string): string {
  return model.trim().toLowerCase();
}

/**
 * Estimate cost in USD for a single provider call.
 * Returns null when the model isn't in the price table — caller should
 * surface "—" rather than a misleading fake.
 */
export function estimateCost(
  model: string | undefined,
  tokens: { prompt?: number; completion?: number } | undefined,
): number | null {
  if (!model || !tokens) return null;
  const p = PRICES[norm(model)];
  if (!p) return null;
  const input  = (tokens.prompt     ?? 0) * (p.inputPer1M  / 1_000_000);
  const output = (tokens.completion ?? 0) * (p.outputPer1M / 1_000_000);
  return input + output;
}

/**
 * Sum costs across multiple legs. Legs with an unknown model are skipped
 * so a single missing model doesn't force the whole total to null — we
 * flag it via `partial`.
 */
export function sumCosts(
  legs: Array<{ model?: string; tokens?: { prompt?: number; completion?: number } }>,
): { total: number; partial: boolean } {
  let total = 0;
  let partial = false;
  for (const leg of legs) {
    const c = estimateCost(leg.model, leg.tokens);
    if (c == null) { partial = true; continue; }
    total += c;
  }
  return { total, partial };
}

/** Format a USD cost for UI display. 4dp under $0.01, 3dp otherwise. */
export function formatUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1)    return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}
