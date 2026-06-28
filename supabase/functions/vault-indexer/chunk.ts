/* ═══════════════════════════════════════════════════════════════════════════
 * Vault indexer — token-aware chunking.
 *
 * Goals:
 *   • Chunks are ≤ MAX_TOKENS (default 800), measured with a REAL tokenizer
 *     (js-tiktoken, cl100k_base — the encoding text-embedding-3-small uses),
 *     so chunk sizes are consistent and stored token_counts are accurate.
 *     If the tokenizer fails to load, we fall back to a char heuristic so
 *     indexing never breaks.
 *   • Chunks overlap so entities that span a boundary aren't lost.
 *   • Prefer to split on paragraph / sentence boundaries; last resort is a
 *     hard character slice.
 *   • Each chunk records the nearest preceding heading/section (when one is
 *     detectable) for richer retrieval context and section-level citations.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { getEncoding, type Tiktoken } from "https://esm.sh/js-tiktoken@1.0.20";

const MAX_TOKENS     = 800;
const OVERLAP_TOKENS = 120;

// Char fallbacks (used only if the tokenizer can't load) + a coarse hard cap
// so we never feed a pathologically huge string to the tokenizer.
const CHARS_PER_TOKEN = 3.5;
const MAX_CHARS     = Math.floor(MAX_TOKENS     * CHARS_PER_TOKEN);
const OVERLAP_CHARS = Math.floor(OVERLAP_TOKENS * CHARS_PER_TOKEN);
const HARD_CHAR_CAP = MAX_TOKENS * 8; // ~6400 chars — well above any real chunk.

/* ─── Tokenizer (lazy, with graceful fallback) ───────────────────────────── */

let _enc: Tiktoken | null = null;
let _encFailed = false;

function encoder(): Tiktoken | null {
  if (_enc || _encFailed) return _enc;
  try {
    _enc = getEncoding("cl100k_base");
  } catch (e) {
    console.error("[chunk] tokenizer load failed, using char heuristic:", e instanceof Error ? e.message : e);
    _encFailed = true;
  }
  return _enc;
}

/** Real token count, falling back to the char heuristic if the tokenizer is unavailable. */
export function countTokens(s: string): number {
  const enc = encoder();
  if (enc) {
    try { return enc.encode(s).length; } catch { /* fall through */ }
  }
  return Math.max(1, Math.round(s.length / CHARS_PER_TOKEN));
}

/** True if `s` fits within a single chunk's token budget. */
function withinLimit(s: string): boolean {
  if (s.length > HARD_CHAR_CAP) return false; // definitely over; skip tokenizing
  return countTokens(s) <= MAX_TOKENS;
}

/** Back-compat alias. */
export function approxTokens(s: string): number {
  return countTokens(s);
}

export interface Chunk {
  content:     string;
  token_count: number;
  /** 1-based source page when known (PDF path); NULL otherwise. */
  page:        number | null;
  /** Nearest preceding heading/section, when detectable. */
  heading?:    string | null;
}

/**
 * Chunk a document that has per-page text (PDFs). Each page is chunked
 * independently so every chunk maps cleanly to exactly one source page,
 * which is what page-level citations need. Empty pages are skipped.
 */
export function chunkPages(pages: string[]): Chunk[] {
  const out: Chunk[] = [];
  pages.forEach((pageText, idx) => {
    const pageNo = idx + 1; // 1-based
    for (const c of chunkDocument(pageText)) {
      out.push({ ...c, page: pageNo });
    }
  });
  return out;
}

/**
 * Split a document into overlapping chunks, respecting paragraph / sentence
 * boundaries where possible. Returns an empty array only if `text` is empty.
 */
export function chunkDocument(text: string): Chunk[] {
  const clean = text.trim();
  if (clean.length === 0) return [];

  // Fast path: tiny docs fit in a single chunk.
  if (withinLimit(clean)) {
    return assignHeadings([{ content: clean, token_count: countTokens(clean), page: null }]);
  }

  const chunks: Chunk[] = [];
  // Split on paragraph boundaries (double newlines) first. Each paragraph is
  // treated atomically until it blows past the token budget — then it gets
  // broken up by sentence.
  const paragraphs = clean.split(/\n\n+/);
  let buffer = "";

  const flushBuffer = () => {
    const content = buffer.trim();
    if (content.length > 0) {
      chunks.push({ content, token_count: countTokens(content), page: null });
    }
    // Keep the tail of the previous chunk as overlap seed for the next one.
    buffer = content.slice(-OVERLAP_CHARS);
  };

  for (const para of paragraphs) {
    const candidate = buffer.length === 0 ? para : `${buffer}\n\n${para}`;

    if (withinLimit(candidate)) {
      buffer = candidate;
      continue;
    }

    // Adding this paragraph overflows. Flush current buffer first.
    if (buffer.trim().length > 0) flushBuffer();

    // Paragraph itself might still be over budget — split it by sentences.
    if (withinLimit(para)) {
      buffer = buffer.length > 0 ? `${buffer}\n\n${para}` : para;
    } else {
      splitOversizedParagraph(para).forEach((piece) => {
        const join = buffer.length === 0 ? piece : `${buffer}\n\n${piece}`;
        if (withinLimit(join)) {
          buffer = join;
        } else {
          if (buffer.trim().length > 0) flushBuffer();
          buffer = piece;
        }
      });
    }
  }

  if (buffer.trim().length > 0) {
    chunks.push({ content: buffer.trim(), token_count: countTokens(buffer.trim()), page: null });
  }

  return assignHeadings(chunks);
}

/** Break a paragraph over the token budget into sentence-ish pieces. */
function splitOversizedParagraph(para: string): string[] {
  // Split on sentence-terminating punctuation followed by a space + capital
  // letter. Greedy but good enough for English research prose.
  const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [para];
  const pieces: string[] = [];
  let buf = "";
  for (const s of sentences) {
    const candidate = buf.length === 0 ? s : `${buf}${s}`;
    if (withinLimit(candidate)) {
      buf = candidate;
    } else {
      if (buf.length > 0) pieces.push(buf.trim());
      // A single monster sentence over budget (pathological but possible).
      if (!withinLimit(s)) {
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

/* ─── Heading / section detection ────────────────────────────────────────── */

/**
 * Detect a heading from a single line. Conservative on purpose — we only
 * accept markdown headings and numbered sections so we don't mislabel body
 * prose as a heading.
 */
function detectHeading(line: string): string | null {
  const t = line.trim();
  if (!t || t.length > 90) return null;
  // Markdown: "## Section title"
  const md = t.match(/^#{1,6}\s+(.{2,90})$/);
  if (md) return md[1].trim();
  // Numbered section: "3.2 Methodology" / "4 Findings"
  const numbered = t.match(/^(\d+(?:\.\d+){0,3})\s+([A-Z][^.!?]{2,80})$/);
  if (numbered) return `${numbered[1]} ${numbered[2].trim()}`;
  return null;
}

/**
 * Walk chunks in order and tag each with the nearest preceding heading. A
 * chunk that contains a heading line adopts the last one in it; chunks with
 * no heading inherit the one carried forward from earlier chunks.
 */
function assignHeadings(chunks: Chunk[]): Chunk[] {
  let last: string | null = null;
  for (const c of chunks) {
    let found: string | null = null;
    for (const line of c.content.split("\n")) {
      const h = detectHeading(line);
      if (h) found = h;
    }
    if (found) last = found;
    c.heading = last;
  }
  return chunks;
}
