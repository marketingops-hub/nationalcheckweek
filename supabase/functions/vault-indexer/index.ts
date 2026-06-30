/* ═══════════════════════════════════════════════════════════════════════════
 * vault-indexer edge function.
 *
 * Invoked fire-and-forget by POST /api/admin/vault/documents (and on-demand by
 * POST /api/admin/vault/documents/[id]/reindex). Runs a fully resumable
 * pipeline so a single edge invocation never has to fit the whole job inside
 * its ~150s wall-clock ceiling:
 *
 *   phase 'prepare' (default): extract + chunk. For PDFs this is page-ranged
 *     and resumable — each invocation processes a slice of pages, persists
 *     their chunks (embedding = NULL), advances vault_documents.extract_cursor,
 *     and self-retriggers ('prepare') until every page is done. Non-PDF
 *     sources (docx/txt/url/paste) are small single-call extractions, so they
 *     stay one-shot. On completion: status='embedding'.
 *   phase 'embed' (repeating): embed the next slice of NULL-embedding chunks,
 *     fill them in, then self-retrigger ('embed') or mark the doc 'ready'.
 *
 * Resumability invariants:
 *   - Chunks persist before embedding; the match_* RPCs ignore NULL-embedding
 *     rows, so a partially-indexed doc never surfaces in search.
 *   - Extraction commits per page-batch and advances extract_cursor. On resume
 *     we delete any chunks with page > extract_cursor (a batch that committed
 *     before its watermark update) and recompute the chunk index, so retries
 *     never duplicate or gap chunks.
 *
 * A *caught* failure lands the row in status='failed' with a readable
 * status_error.
 *
 * ENV: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · OPENAI_API_KEY
 *      FIRECRAWL_API_KEY (only for kind='url')
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractDocx, extractTxt, extractUrl, loadPdf, extractPdfPageRange } from "./extract.ts";
import { chunkDocument } from "./chunk.ts";
import { embedBatch } from "./embed.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STORAGE_BUCKET = "vault";

// Per-invocation wall-clock budget for the actual work. Comfortably under the
// ~150s edge ceiling so the in-flight batch + the self-retrigger both finish.
const BUDGET_MS = 100_000;
// Hard cap on pages processed per invocation. pdf.js memory grows with pages
// touched in a single invocation; large PDFs were OOM-killed around ~80 pages
// BEFORE the time budget could trigger a hand-off, so they froze. Handing off
// to a fresh invocation every N pages keeps peak memory flat (each invocation
// re-parses the PDF cheaply and processes only its slice). Pages are now
// processed one at a time with a pre-claimed cursor so a single poison page
// can't loop the pipeline.
const MAX_PAGES_PER_INVOCATION = 30;
// Chunks embedded per DB round. embedBatch sub-batches these by 64 to OpenAI.
const EMBED_SLICE = 192;
const UPDATE_CONCURRENCY = 25;

interface Ctx {
  sbUrl:         string;
  sbKey:         string;
  openaiKey:     string;
  firecrawlKey?: string;
}

interface DocumentRow {
  id:             string;
  kind:           "pdf" | "docx" | "txt" | "url" | "paste";
  storage_path:   string | null;
  source:         string | null;
  title:          string;
  raw_text:       string | null;
  status:         string;
  extract_cursor: number;
}

type SbClient = ReturnType<typeof createClient>;

const SCANNED_PDF_MSG =
  "This PDF appears to be scanned (image-only) — no selectable text could be extracted. " +
  "Add a text layer with OCR (e.g. Adobe Acrobat → Scan & OCR, or a free online OCR tool), then re-upload. " +
  "Alternatively, paste the key text directly via Vault upload → Paste text.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Only POST is supported." }, 405);

  const ctx: Ctx = {
    sbUrl:        Deno.env.get("SUPABASE_URL") ?? "",
    sbKey:        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    openaiKey:    Deno.env.get("OPENAI_API_KEY") ?? "",
    firecrawlKey: Deno.env.get("FIRECRAWL_API_KEY") ?? undefined,
  };
  if (!ctx.sbUrl || !ctx.sbKey || !ctx.openaiKey) {
    return json({ error: "Missing SUPABASE_* or OPENAI_API_KEY env vars." }, 500);
  }

  // We run our own auth: verify_jwt is disabled for this function (see
  // config.toml) so the resumable self-trigger can authenticate with
  // EDGE_SHARED_SECRET — a plain secret, not a Supabase JWT, which the gateway
  // would otherwise reject. Accept EDGE_SHARED_SECRET or the service key.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const shared = Deno.env.get("EDGE_SHARED_SECRET") ?? "";
  if (!((shared && timingSafeEqual(token, shared)) || (ctx.sbKey && timingSafeEqual(token, ctx.sbKey)))) {
    return json({ error: "Unauthorized." }, 401);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON body." }, 400); }

  const document_id = String(body.document_id ?? "");
  if (!document_id) return json({ error: "document_id is required." }, 400);
  const phase = body.phase === "embed" ? "embed" : "prepare";

  const work = runPhase(document_id, phase, ctx).catch((err) => {
    console.error(`[vault-indexer] ${phase} failed for ${document_id}:`, err);
  });

  // deno-lint-ignore no-explicit-any
  const er = (globalThis as any).EdgeRuntime;
  if (er?.waitUntil) {
    er.waitUntil(work);
    return json({ accepted: true, document_id, phase }, 202);
  }
  await work;
  return json({ ok: true, document_id, phase });
});

/* ─── Phase dispatch ─────────────────────────────────────────────────────── */

async function runPhase(document_id: string, phase: "prepare" | "embed", ctx: Ctx) {
  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const invocationStart = Date.now();

  const { data: doc, error: loadErr } = await sb
    .from("vault_documents")
    .select("id, kind, storage_path, source, title, raw_text, status, extract_cursor")
    .eq("id", document_id)
    .single<DocumentRow>();
  if (loadErr || !doc) throw new Error(`Document not found: ${loadErr?.message ?? "no row"}`);

  try {
    if (phase !== "embed") {
      const completed = await extractAndChunk(sb, doc, ctx, invocationStart);
      if (!completed) return;  // extraction re-triggered 'prepare' for more pages
      // Extraction finished; if we're low on budget hand embedding to a fresh
      // invocation rather than risk overrunning the wall-clock here.
      if (Date.now() - invocationStart > BUDGET_MS) {
        await fireContinuation(ctx, doc.id, "embed");
        return;
      }
    }
    await embedLoop(sb, ctx, doc.id, invocationStart);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sb.from("vault_documents").update({ status: "failed", status_error: msg }).eq("id", doc.id);
    throw err;
  }
}

/* ─── Extract + chunk (resumable for PDF, one-shot otherwise) ─────────────── */

/** Returns true when extraction+chunking is fully done (status set to
 *  'embedding'); false when it re-triggered itself for more PDF pages. */
async function extractAndChunk(
  sb: SbClient, doc: DocumentRow, ctx: Ctx, invocationStart: number,
): Promise<boolean> {
  if (doc.kind !== "pdf") {
    await oneShotExtract(sb, doc, ctx);
    return true;
  }

  // ── PDF: page-ranged, resumable ──────────────────────────────────────────
  if (!doc.storage_path) throw new Error("PDF document has no storage_path.");
  const bytes = await downloadFromStorage(sb, doc.storage_path);
  const { pdf, numPages } = await loadPdf(bytes);
  if (!numPages || numPages < 1) throw new Error("PDF has no pages.");

  let cursor: number;
  if (doc.status === "pending") {
    // Fresh start: wipe any prior chunks and reset the watermark.
    await sb.from("vault_chunks").delete().eq("document_id", doc.id);
    await sb.from("vault_documents")
      .update({ status: "extracting", status_error: null, extract_cursor: 0, page_count: numPages })
      .eq("id", doc.id);
    cursor = 0;
  } else {
    // Resume: trust the committed watermark, and drop any chunks past it that
    // a previous run inserted before it could advance the cursor.
    cursor = doc.extract_cursor ?? 0;
    await sb.from("vault_chunks").delete().eq("document_id", doc.id).gt("page", cursor);
    await setStatus(sb, doc.id, "extracting"); // heartbeat updated_at
  }

  // Next contiguous chunk_index = count of chunks at/under the watermark.
  const { count: existing } = await sb.from("vault_chunks")
    .select("id", { count: "exact", head: true }).eq("document_id", doc.id);
  let nextIdx = existing ?? 0;

  const startCursor = cursor;
  while (cursor < numPages) {
    const p = cursor + 1;

    // Pre-claim this page: advance the watermark BEFORE extracting it. A page
    // can hard-crash the worker (a synchronous OOM in pdf.js that the per-page
    // timeout cannot interrupt). If we advanced the cursor only AFTER success,
    // the next invocation would resume on the same poison page and loop
    // forever. By claiming it first, a crash makes the next run skip past this
    // one page (losing just its text) and carry on — guaranteed progress.
    await sb.from("vault_documents").update({ extract_cursor: p }).eq("id", doc.id);

    const [text] = await extractPdfPageRange(pdf, p, p);
    const rows = chunkDocument(text ?? "").map((c) => ({
      document_id: doc.id,
      chunk_index: nextIdx++,
      content:     c.content,
      token_count: c.token_count,
      page:        p,
      heading:     c.heading ?? null,
      embedding:   null,
    }));
    if (rows.length > 0) {
      const { error } = await sb.from("vault_chunks").insert(rows);
      if (error) throw new Error(`chunk insert failed: ${error.message}`);
    }
    // Surface running chunk total so the UI's "N chunks" climbs live.
    await sb.from("vault_documents").update({ chunk_count: nextIdx }).eq("id", doc.id);

    cursor = p;
    if (cursor < numPages &&
        (Date.now() - invocationStart > BUDGET_MS ||
         cursor - startCursor >= MAX_PAGES_PER_INVOCATION)) {
      await fireContinuation(ctx, doc.id, "prepare");
      return false;
    }
  }

  // All pages processed.
  const { count: total } = await sb.from("vault_chunks")
    .select("id", { count: "exact", head: true }).eq("document_id", doc.id);
  if (!total || total === 0) throw new Error(SCANNED_PDF_MSG);

  await sb.from("vault_documents")
    .update({ status: "embedding", status_error: null, page_count: numPages, chunk_count: total })
    .eq("id", doc.id);
  return true;
}

/** Non-PDF: small single-call extraction (docx/txt/url/paste). */
async function oneShotExtract(sb: SbClient, doc: DocumentRow, ctx: Ctx) {
  await setStatus(sb, doc.id, "extracting");
  const extraction = await runExtract(sb, doc, ctx);
  if (extraction.title && doc.title.startsWith("Untitled")) {
    await sb.from("vault_documents").update({ title: extraction.title }).eq("id", doc.id);
  }

  await setStatus(sb, doc.id, "chunking");
  const chunks = chunkDocument(extraction.text);
  if (chunks.length === 0) throw new Error("Chunker produced 0 chunks.");

  await sb.from("vault_chunks").delete().eq("document_id", doc.id);
  const rows = chunks.map((c, i) => ({
    document_id: doc.id, chunk_index: i, content: c.content,
    token_count: c.token_count, page: c.page, heading: c.heading ?? null, embedding: null,
  }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from("vault_chunks").insert(rows.slice(i, i + 200));
    if (error) throw new Error(`chunk insert failed: ${error.message}`);
  }

  await sb.from("vault_documents").update({
    status: "embedding", status_error: null,
    char_count: extraction.char_count, chunk_count: chunks.length, page_count: null,
  }).eq("id", doc.id);
}

/* ─── Embed loop (drains NULL-embedding chunks, time-bounded) ─────────────── */

async function embedLoop(sb: SbClient, ctx: Ctx, document_id: string, invocationStart: number) {
  await setStatus(sb, document_id, "embedding"); // heartbeat

  while (true) {
    const { data: pending, error: selErr } = await sb
      .from("vault_chunks")
      .select("id, content")
      .eq("document_id", document_id)
      .is("embedding", null)
      .order("chunk_index", { ascending: true })
      .limit(EMBED_SLICE);
    if (selErr) throw new Error(`failed to load pending chunks: ${selErr.message}`);

    if (!pending || pending.length === 0) {
      await markReady(sb, document_id);
      return;
    }

    const { embeddings, model } = await embedBatch(ctx.openaiKey, pending.map((c) => c.content as string));
    if (embeddings.length !== pending.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} vs ${pending.length} chunks`);
    }

    for (let i = 0; i < pending.length; i += UPDATE_CONCURRENCY) {
      const group = pending.slice(i, i + UPDATE_CONCURRENCY);
      await Promise.all(group.map((c, j) => {
        const emb = embeddings[i + j];
        return sb.from("vault_chunks")
          .update({ embedding: emb, embedding_model: model, embedding_dims: emb?.length ?? null })
          .eq("id", c.id as string);
      }));
    }

    // Touch updated_at each slice so the stall/auto-resume detector doesn't
    // mistake a long-but-healthy embed for a crash.
    await setStatus(sb, document_id, "embedding");

    if (Date.now() - invocationStart > BUDGET_MS) {
      await fireContinuation(ctx, document_id, "embed");
      return;
    }
  }
}

/** Mark ready, deriving token_count from the persisted chunks. */
async function markReady(sb: SbClient, document_id: string) {
  const { data: toks } = await sb.from("vault_chunks").select("token_count").eq("document_id", document_id);
  const token_count = (toks ?? []).reduce(
    (s: number, r: { token_count: number | null }) => s + (r.token_count ?? 0), 0,
  ) || null;
  // Reconcile chunk_count from the authoritative row set at ready time.
  const chunk_count = (toks ?? []).length;
  const { error } = await sb.from("vault_documents")
    .update({ status: "ready", status_error: null, token_count, chunk_count, raw_text: null })
    .eq("id", document_id);
  if (error) throw new Error(`failed to mark ready: ${error.message}`);
}

/** Fire a non-blocking continuation for the same document. The target responds
 *  202 immediately (work runs via waitUntil), so this resolves quickly. */
async function fireContinuation(ctx: Ctx, document_id: string, phase: "prepare" | "embed") {
  try {
    // Use the shared secret so the call passes our own requireAuth above. The
    // service key is NOT a gateway-valid JWT on new-API-key projects, which is
    // exactly what stalled the continuation before.
    const bearer = Deno.env.get("EDGE_SHARED_SECRET") || ctx.sbKey;
    const res = await fetch(`${ctx.sbUrl}/functions/v1/vault-indexer`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${bearer}` },
      body:    JSON.stringify({ document_id, phase }),
    });
    await res.text().catch(() => {});
  } catch (err) {
    console.error(`[vault-indexer] continuation (${phase}) trigger failed for ${document_id}:`, err);
  }
}

/* ─── Non-PDF extract dispatch ───────────────────────────────────────────── */

async function runExtract(
  sb: SbClient, doc: DocumentRow, ctx: Ctx,
): Promise<{ text: string; char_count: number; title?: string }> {
  switch (doc.kind) {
    case "paste": {
      if (!doc.raw_text || doc.raw_text.trim().length === 0) {
        throw new Error("Pasted document has no raw_text — re-create with content.");
      }
      return { text: doc.raw_text, char_count: doc.raw_text.length };
    }
    case "url": {
      if (!ctx.firecrawlKey) throw new Error("FIRECRAWL_API_KEY is required for kind='url'.");
      if (!doc.source)       throw new Error("URL document has no source URL.");
      return await extractUrl(doc.source, ctx.firecrawlKey);
    }
    case "docx":
    case "txt": {
      if (!doc.storage_path) throw new Error(`${doc.kind.toUpperCase()} document has no storage_path.`);
      const bytes = await downloadFromStorage(sb, doc.storage_path);
      if (doc.kind === "docx") return await extractDocx(bytes);
      return extractTxt(bytes);
    }
    default:
      throw new Error(`runExtract called for unsupported kind '${doc.kind}'.`);
  }
}

/* ─── Storage download ───────────────────────────────────────────────────── */

async function downloadFromStorage(sb: SbClient, path: string): Promise<Uint8Array> {
  const { data, error } = await sb.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  return new Uint8Array(await data.arrayBuffer());
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

async function setStatus(sb: SbClient, id: string, status: string) {
  await sb.from("vault_documents").update({ status }).eq("id", id);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Constant-time string compare; length mismatch short-circuits. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
