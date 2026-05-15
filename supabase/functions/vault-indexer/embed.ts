/* ═══════════════════════════════════════════════════════════════════════════
 * Vault indexer — OpenAI embeddings client.
 *
 * text-embedding-3-small was chosen because:
 *   • 1536 dims — same as the old ada-002, compatible indexing setup.
 *   • $0.02 / 1M tokens — cheap enough to re-embed the whole vault on
 *     model upgrades without a budget meeting.
 *   • Batches of up to 2048 inputs per request. We cap at 64 for latency
 *     reasons (any single slow request blocks the pipeline).
 * ═══════════════════════════════════════════════════════════════════════════ */

const MODEL      = "text-embedding-3-small";
const BATCH_SIZE = 64;

export interface EmbedResult {
  embeddings: number[][];
  total_tokens: number;
  model: string;
}

/**
 * Embed an array of texts. Returns embeddings in the same order as the input.
 * Retries transient errors (429, 500, 502, 503) with exponential backoff.
 */
export async function embedBatch(
  apiKey: string,
  inputs: string[],
): Promise<EmbedResult> {
  if (inputs.length === 0) {
    return { embeddings: [], total_tokens: 0, model: MODEL };
  }

  const embeddings: number[][] = new Array(inputs.length);
  let total_tokens = 0;

  for (let offset = 0; offset < inputs.length; offset += BATCH_SIZE) {
    const batch = inputs.slice(offset, offset + BATCH_SIZE);
    const res = await requestWithRetry(apiKey, batch);
    for (let i = 0; i < res.data.length; i++) {
      embeddings[offset + i] = res.data[i].embedding;
    }
    total_tokens += res.usage?.total_tokens ?? 0;
  }

  return { embeddings, total_tokens, model: MODEL };
}

interface EmbeddingResponse {
  data:  { embedding: number[]; index: number }[];
  usage: { total_tokens?: number };
  model: string;
}

async function requestWithRetry(apiKey: string, inputs: string[]): Promise<EmbeddingResponse> {
  const maxAttempts = 4;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ model: MODEL, input: inputs }),
      });

      if (res.ok) {
        return await res.json() as EmbeddingResponse;
      }

      // 4xx (except 429) are not worth retrying — surface the error now.
      if (res.status !== 429 && res.status < 500) {
        const body = await res.text();
        throw new Error(`openai embeddings ${res.status}: ${body.slice(0, 300)}`);
      }

      lastErr = new Error(`openai ${res.status}`);
    } catch (err) {
      lastErr = err;
    }

    // Exponential back-off: 500 ms, 1s, 2s
    const delay = 500 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, delay));
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("openai embeddings failed after retries");
}
