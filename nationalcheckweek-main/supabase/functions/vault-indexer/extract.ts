/* ═══════════════════════════════════════════════════════════════════════════
 * Vault indexer — text extraction.
 *
 * One function per supported document kind. All return plain UTF-8 text
 * ready for chunking. Failures throw with a descriptive message so the
 * caller can write it into `status_error`.
 *
 * unpdf works in Deno / edge runtimes (no Node-specific filesystem APIs).
 * mammoth is Node-only, so we call a small WASM-free ESM port via esm.sh.
 * For URLs we reuse the admin Firecrawl endpoint via an authenticated fetch.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@1.6.0";

export interface ExtractResult {
  text:       string;
  char_count: number;
}

/* ─── PDF ────────────────────────────────────────────────────────────────── */

export async function extractPdf(bytes: Uint8Array): Promise<ExtractResult> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = typeof text === "string" ? text : text.join("\n\n");
  const cleaned = normaliseWhitespace(merged);
  if (cleaned.length === 0) {
    throw new Error(
      "PDF extracted 0 characters. Scanned / image-only PDFs aren't supported — try OCR first.",
    );
  }
  return { text: cleaned, char_count: cleaned.length };
}

/* ─── DOCX (mammoth, via esm.sh — no Node fs dependency) ─────────────────── */

export async function extractDocx(bytes: Uint8Array): Promise<ExtractResult> {
  // mammoth's rawText API expects an ArrayBuffer.
  const mod = await import("https://esm.sh/mammoth@1.9.0?bundle");
  const { value } = await mod.extractRawText({ arrayBuffer: bytes.buffer });
  const cleaned = normaliseWhitespace(value);
  if (cleaned.length === 0) throw new Error("DOCX extracted 0 characters.");
  return { text: cleaned, char_count: cleaned.length };
}

/* ─── TXT / MD ───────────────────────────────────────────────────────────── */

export function extractTxt(bytes: Uint8Array): ExtractResult {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const cleaned = normaliseWhitespace(text);
  if (cleaned.length === 0) throw new Error("Text file is empty.");
  return { text: cleaned, char_count: cleaned.length };
}

/* ─── URL (Firecrawl) ────────────────────────────────────────────────────── */

/**
 * Calls Firecrawl directly (not via the Next.js proxy) so the edge function
 * can run independently. FIRECRAWL_API_KEY must be set as an edge secret.
 */
export async function extractUrl(
  url: string,
  firecrawlKey: string,
): Promise<ExtractResult & { title?: string }> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${firecrawlKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"] }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Firecrawl ${res.status}: ${body.slice(0, 300)}`);
  }

  const payload = await res.json() as {
    data?: { markdown?: string; metadata?: { title?: string } };
  };
  const md = payload.data?.markdown ?? "";
  const cleaned = normaliseWhitespace(md);
  if (cleaned.length === 0) throw new Error("Firecrawl returned empty markdown.");
  return {
    text:       cleaned,
    char_count: cleaned.length,
    title:      payload.data?.metadata?.title,
  };
}

/* ─── shared ─────────────────────────────────────────────────────────────── */

/**
 * Collapse weird Unicode whitespace and strip obvious PDF artefacts. We keep
 * paragraph breaks (double newlines) so chunking can use them as hints.
 */
function normaliseWhitespace(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
