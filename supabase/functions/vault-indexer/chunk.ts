/* ═══════════════════════════════════════════════════════════════════════════
 * Vault indexer — token-aware chunking.
 *
 * Goals:
 *   • Chunks are ≤ MAX_TOKENS (default 800) — leaves plenty of headroom when
 *     12 are stuffed into a 128k context window.
 *   • Chunks overlap by OVERLAP_TOKENS (default 120) so entities that span
 *     a boundary aren't lost.
 *   • Prefer to split on paragraph / sentence boundaries; fall back to word
 *     boundaries; last resort is hard character slicing.
 *   • Token counts are approximate (encoded by gpt-tokenizer's cl100k_base
 *     in the API layer; this module uses a cheap heuristic because we
 *     can't bundle the 1.5 MB tokenizer into a Deno edge fn efficiently).
 * ═══════════════════════════════════════════════════════════════════════════ */

const MAX_TOKENS     = 800;
const OVERLAP_TOKENS = 120;

// GPT tokens average ~4 characters of English, with variance. We're slightly
// conservative (3.5 chars / token) so we never exceed the hard model limit
// at retrieval time.
const CHARS_PER_TOKEN = 3.5;
const MAX_CHARS     = Math.floor(MAX_TOKENS     * CHARS_PER_TOKEN);
const OVERLAP_CHARS = Math.floor(OVERLAP_TOKENS * CHARS_PER_TOKEN);

export interface Chunk {
  content:     string;
  token_count: number;
}

/**
 * Split a document into overlapping chunks, respecting paragraph / sentence
 * boundaries where possible. Returns an empty array only if `text` is empty.
 */
export function chunkDocument(text: string): Chunk[] {
  const clean = text.trim();
  if (clean.length === 0) return [];

  // Fast path: tiny docs fit in a single chunk.
  if (clean.length <= MAX_CHARS) {
    return [{ content: clean, token_count: approxTokens(clean) }];
  }

  const chunks: Chunk[] = [];
  // Split on paragraph boundaries (double newlines) first. Each paragraph is
  // treated atomically until it blows past MAX_CHARS — then it gets broken
  // up by sentence.
  const paragraphs = clean.split(/\n\n+/);
  let buffer = "";

  const flushBuffer = () => {
    const content = buffer.trim();
    if (content.length > 0) {
      chunks.push({ content, token_count: approxTokens(content) });
    }
    // Keep the tail of the previous chunk as overlap seed for the next one.
    buffer = content.slice(-OVERLAP_CHARS);
  };

  for (const para of paragraphs) {
    const candidate = buffer.length === 0 ? para : `${buffer}\n\n${para}`;

    if (candidate.length <= MAX_CHARS) {
      buffer = candidate;
      continue;
    }

    // Adding this paragraph overflows. Flush current buffer first.
    if (buffer.trim().length > 0) flushBuffer();

    // Paragraph itself might still be > MAX_CHARS — split it by sentences.
    if (para.length <= MAX_CHARS) {
      buffer = buffer.length > 0 ? `${buffer}\n\n${para}` : para;
    } else {
      splitOversizedParagraph(para).forEach((piece) => {
        const join = buffer.length === 0 ? piece : `${buffer}\n\n${piece}`;
        if (join.length <= MAX_CHARS) {
          buffer = join;
        } else {
          if (buffer.trim().length > 0) flushBuffer();
          buffer = piece;
        }
      });
    }
  }

  if (buffer.trim().length > 0) {
    chunks.push({ content: buffer.trim(), token_count: approxTokens(buffer.trim()) });
  }

  return chunks;
}

/** Break a paragraph longer than MAX_CHARS into sentence-ish pieces. */
function splitOversizedParagraph(para: string): string[] {
  // Split on sentence-terminating punctuation followed by a space + capital
  // letter. Greedy but good enough for English research prose.
  const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [para];
  const pieces: string[] = [];
  let buf = "";
  for (const s of sentences) {
    const candidate = buf.length === 0 ? s : `${buf}${s}`;
    if (candidate.length <= MAX_CHARS) {
      buf = candidate;
    } else {
      if (buf.length > 0) pieces.push(buf.trim());
      // A single monster sentence > MAX_CHARS (pathological but possible).
      if (s.length > MAX_CHARS) {
        pieces.push(...hardSlice(s, MAX_CHARS, OVERLAP_CHARS));
        buf = "";
      } else {
        buf = s;
      }
    }
  }
  if (buf.trim().length > 0) pieces.push(buf.trim());
  return pieces;
}

/** Last-resort: character-count slicer with overlap. */
function hardSlice(s: string, size: number, overlap: number): string[] {
  const out: string[] = [];
  const stride = size - overlap;
  for (let i = 0; i < s.length; i += stride) {
    out.push(s.slice(i, i + size).trim());
  }
  return out.filter((x) => x.length > 0);
}

/** Cheap token approximation — does not call any tokenizer library. */
export function approxTokens(s: string): number {
  return Math.max(1, Math.round(s.length / CHARS_PER_TOKEN));
}
