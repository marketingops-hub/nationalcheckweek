/* ═══════════════════════════════════════════════════════════════════════════
 * vault-indexer edge function.
 *
 * Invoked fire-and-forget by POST /api/admin/vault/documents (and on-demand by
 * POST /api/admin/vault/documents/[id]/reindex). Given a document_id, runs the
 * pipeline in two resumable phases so a single edge invocation never has to
 * fit the whole job inside its ~150s wall-clock ceiling:
 *
 *   phase 'prepare' (default):   extract → chunk → persist chunk rows WITHOUT
 *                                embeddings (embedding = NULL), status='embedding'
 *   phase 'embed'   (repeating): embed the next slice of NULL-embedding chunks,
 *                                fill them in, then either self-retrigger for the
 *                                next slice or mark the document 'ready'.
 *
 * Because chunks are persisted before embedding, an invocation that is killed
 * part-way is fully resumable: the next 'embed' pass simply picks up the chunks
 * that still have a NULL embedding. The match_* RPCs already ignore NULL-
 * embedding chunks, so a half-embedded document is never returned by search.
 *
 * Each stage updates `vault_documents.status` for the admin UI. A *caught*
 * failure lands the row in status='failed' with a readable status_error.
 *
 * ENV required:
 *   SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · OPENAI_API_KEY
 *   FIRECRAWL_API_KEY (only for kind='url')
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractPdf, extractDocx, extractTxt, extractUrl } from "./extract.ts";
import { chunkDocument, chunkPages } from "./chunk.ts";
import { embedBatch }     from "./embed.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STORAGE_BUCKET = "vault";

// How long a single invocation may spend embedding before it persists progress,
// fires a continuation, and returns. Comfortably under the ~150s edge ceiling
// so the in-flight slice + the continuation trigger both finish in time.
const EMBED_TIME_BUDGET_MS = 110_000;

// Chunks pulled per embed round. embedBatch sub-batches these by 64 to OpenAI;
// 192 = up to 3 OpenAI calls per DB round-trip.
const EMBED_SLICE = 192;

interface Ctx {
  sbUrl:         string;
  sbKey:         string;
  openaiKey:     string;
  firecrawlKey?: string;
}

interface DocumentRow {
  id:           string;
  kind:         "pdf" | "docx" | "txt" | "url" | "paste";
  storage_path: string | null;
  source:       string | null;
  title:        string;
  raw_text:     string | null;
  status:       string;
}

type SbClient = ReturnType<typeof createClient>;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "Only POST is supported." }, 405);
  }

  const ctx: Ctx = {
    sbUrl:        Deno.env.get("SUPABASE_URL") ?? "",
    sbKey:        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    openaiKey:    Deno.env.get("OPENAI_API_KEY") ?? "",
    firecrawlKey: Deno.env.get("FIRECRAWL_API_KEY") ?? undefined,
  };
  if (!ctx.sbUrl || !ctx.sbKey || !ctx.openaiKey) {
    return json({ error: "Missing SUPABASE_* or OPENAI_API_KEY env vars." }, 500);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON body." }, 400); }

  const document_id = String(body.document_id ?? "");
  if (!document_id) return json({ error: "document_id is required." }, 400);
  const phase = body.phase === "embed" ? "embed" : "prepare";

  // Run the (potentially long) work as a background task so the HTTP response
  // returns immediately — this keeps the self-retrigger non-blocking (the
  // continuation call gets a fast 202 instead of waiting out the slice). Falls
  // back to awaiting inline when the runtime doesn't expose waitUntil.
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

  const { data: doc, error: loadErr } = await sb
    .from("vault_documents")
    .select("id, kind, storage_path, source, title, raw_text, status")
    .eq("id", document_id)
    .single<DocumentRow>();
  if (loadErr || !doc) throw new Error(`Document not found: ${loadErr?.message ?? "no row"}`);

  try {
    if (phase === "prepare") {
      await prepareDocument(sb, doc, ctx);
    }
    // Both phases finish by draining whatever NULL-embedding chunks remain.
    await embedLoop(sb, ctx, doc.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sb
      .from("vault_documents")
      .update({ status: "failed", status_error: msg })
      .eq("id", doc.id);
    throw err;
  }
}

/* ─── Phase 1: prepare (extract + chunk + persist chunk rows) ─────────────── */

async function prepareDocument(sb: SbClient, doc: DocumentRow, ctx: Ctx) {
  // EXTRACT
  await setStatus(sb, doc.id, "extracting");
  const extraction = await runExtract(sb, doc, ctx);
  if (extraction.title && doc.title.startsWith("Untitled")) {
    await sb.from("vault_documents").update({ title: extraction.title }).eq("id", doc.id);
  }

  // CHUNK
  await setStatus(sb, doc.id, "chunking");
  const chunks = extraction.pages && extraction.pages.length > 0
    ? chunkPages(extraction.pages)
    : chunkDocument(extraction.text);
  if (chunks.length === 0) throw new Error("Chunker produced 0 chunks.");

  // Wipe any previous chunks (re-index / resumed-prepare case) so chunk_index
  // stays contiguous and we don't mix stale rows with the new run.
  const { error: delErr } = await sb.from("vault_chunks").delete().eq("document_id", doc.id);
  if (delErr) throw new Error(`failed to clear old chunks: ${delErr.message}`);

  // Persist chunk rows WITHOUT embeddings. These are small (no 1536-float
  // vector), so even a few thousand insert comfortably within one invocation.
  const rows = chunks.map((c, i) => ({
    document_id:  doc.id,
    chunk_index:  i,
    content:      c.content,
    token_count:  c.token_count,
    page:         c.page,
    heading:      c.heading ?? null,
    embedding:    null,
  }));
  const INSERT_BATCH = 200;
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const { error: insErr } = await sb.from("vault_chunks").insert(rows.slice(i, i + INSERT_BATCH));
    if (insErr) throw new Error(`chunk insert failed: ${insErr.message}`);
  }

  // Record structural stats now; token_count + status='ready' come after the
  // embed loop drains. raw_text is intentionally NOT cleared here — a resumed
  // prepare for kind='paste' still needs it. It's cleared on ready.
  const { error: upErr } = await sb
    .from("vault_documents")
    .update({
      status:       "embedding",
      status_error: null,
      char_count:   extraction.char_count,
      chunk_count:  chunks.length,
      page_count:   extraction.pages?.length ?? null,
    })
    .eq("id", doc.id);
  if (upErr) throw new Error(`document update failed: ${upErr.message}`);
}

/* ─── Phase 2: embed loop (drains NULL-embedding chunks, time-bounded) ────── */

async function embedLoop(sb: SbClient, ctx: Ctx, document_id: string) {
  const start = Date.now();

  // Heartbeat: bump the document row (via the updated_at trigger) at the start
  // of every embed invocation. A multi-invocation embed otherwise leaves
  // updated_at frozen at 'prepare' time, which the UI's stuck-detector (4 min)
  // would misread as stalled even while it's actively progressing.
  await setStatus(sb, document_id, "embedding");

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

    const inputs = pending.map((c) => c.content as string);
    const { embeddings, model } = await embedBatch(ctx.openaiKey, inputs);
    if (embeddings.length !== pending.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} vs ${pending.length} chunks`);
    }

    // Fill in the embeddings. Bounded concurrency keeps the connection pool
    // happy while still being far faster than serial round-trips.
    const UPDATE_CONCURRENCY = 25;
    for (let i = 0; i < pending.length; i += UPDATE_CONCURRENCY) {
      const group = pending.slice(i, i + UPDATE_CONCURRENCY);
      await Promise.all(group.map((c, j) => {
        const emb = embeddings[i + j];
        return sb.from("vault_chunks")
          .update({ embedding: emb, embedding_model: model, embedding_dims: emb?.length ?? null })
          .eq("id", c.id as string);
      }));
    }

    // Out of time for this invocation? Hand off to a fresh one and stop.
    if (Date.now() - start > EMBED_TIME_BUDGET_MS) {
      await fireContinuation(ctx, document_id);
      return;
    }
  }
}

/** Mark the document ready, deriving token_count from the persisted chunks. */
async function markReady(sb: SbClient, document_id: string) {
  const { data: toks } = await sb
    .from("vault_chunks")
    .select("token_count")
    .eq("document_id", document_id);
  const token_count = (toks ?? []).reduce(
    (s: number, r: { token_count: number | null }) => s + (r.token_count ?? 0), 0,
  ) || null;

  const { error } = await sb
    .from("vault_documents")
    .update({ status: "ready", status_error: null, token_count, raw_text: null })
    .eq("id", document_id);
  if (error) throw new Error(`failed to mark ready: ${error.message}`);
}

/** Fire a non-blocking 'embed' continuation for the same document. The target
 *  responds 202 immediately (it runs its work via waitUntil), so this resolves
 *  quickly rather than waiting out the next slice. */
async function fireContinuation(ctx: Ctx, document_id: string) {
  try {
    const res = await fetch(`${ctx.sbUrl}/functions/v1/vault-indexer`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ctx.sbKey}` },
      body:    JSON.stringify({ document_id, phase: "embed" }),
    });
    await res.text().catch(() => {}); // drain the small body so the socket closes
  } catch (err) {
    // If the trigger fails the document stays in 'embedding' with its chunks
    // persisted — the admin's Re-index (or a future sweep) resumes it.
    console.error(`[vault-indexer] continuation trigger failed for ${document_id}:`, err);
  }
}

/* ─── Extract dispatch ───────────────────────────────────────────────────── */

async function runExtract(
  sb: SbClient,
  doc: DocumentRow,
  ctx: Ctx,
): Promise<{ text: string; char_count: number; title?: string; pages?: string[] }> {
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

    case "pdf":
    case "docx":
    case "txt": {
      if (!doc.storage_path) throw new Error(`${doc.kind.toUpperCase()} document has no storage_path.`);
      const bytes = await downloadFromStorage(sb, doc.storage_path);
      if (doc.kind === "pdf")  return await extractPdf(bytes);
      if (doc.kind === "docx") return await extractDocx(bytes);
      return extractTxt(bytes);
    }
  }
}

async function downloadFromStorage(sb: SbClient, path: string): Promise<Uint8Array> {
  const { data, error } = await sb.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  const buf = await data.arrayBuffer();
  return new Uint8Array(buf);
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

async function setStatus(sb: SbClient, id: string, status: string) {
  await sb.from("vault_documents").update({ status }).eq("id", id);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
