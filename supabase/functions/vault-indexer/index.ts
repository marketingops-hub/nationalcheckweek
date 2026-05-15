/* ═══════════════════════════════════════════════════════════════════════════
 * vault-indexer edge function.
 *
 * Single entry point, invoked fire-and-forget by POST /api/admin/vault/documents
 * (and on-demand by POST /api/admin/vault/documents/[id]/reindex). Given a
 * document_id, runs the full pipeline:
 *
 *   extract → chunk → embed → store
 *
 * Each stage updates `vault_documents.status` so the admin UI can show
 * progress. A failure at any stage lands the row in status='failed' with a
 * readable `status_error`. The row is never left in a pending state.
 *
 * ENV required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 *   FIRECRAWL_API_KEY      (only needed for kind='url')
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractPdf, extractDocx, extractTxt, extractUrl } from "./extract.ts";
import { chunkDocument } from "./chunk.ts";
import { embedBatch }     from "./embed.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STORAGE_BUCKET = "vault";

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

// deno-lint-ignore no-explicit-any
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

  try {
    const result = await indexDocument(document_id, ctx);
    return json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});

/* ─── Pipeline ───────────────────────────────────────────────────────────── */

async function indexDocument(document_id: string, ctx: Ctx) {
  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Load.
  const { data: doc, error: loadErr } = await sb
    .from("vault_documents")
    .select("id, kind, storage_path, source, title, raw_text, status")
    .eq("id", document_id)
    .single<DocumentRow>();
  if (loadErr || !doc) throw new Error(`Document not found: ${loadErr?.message ?? "no row"}`);

  try {
    // 2. EXTRACT — pull text out of the source.
    await setStatus(sb, doc.id, "extracting");
    const extraction = await runExtract(sb, doc, ctx);
    if (extraction.title && doc.title.startsWith("Untitled")) {
      // Auto-fill title from Firecrawl metadata if the admin didn't provide one.
      await sb.from("vault_documents").update({ title: extraction.title }).eq("id", doc.id);
    }

    // 3. CHUNK — split extracted text into overlapping slices.
    await setStatus(sb, doc.id, "chunking");
    const chunks = chunkDocument(extraction.text);
    if (chunks.length === 0) throw new Error("Chunker produced 0 chunks.");

    // Wipe any previous chunks (re-index case).
    await sb.from("vault_chunks").delete().eq("document_id", doc.id);

    // 4. EMBED — batch to OpenAI.
    await setStatus(sb, doc.id, "embedding");
    const { embeddings, total_tokens, model } = await embedBatch(
      ctx.openaiKey,
      chunks.map((c) => c.content),
    );
    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} vs ${chunks.length} chunks`);
    }

    // 5. STORE — chunks in.
    const rows = chunks.map((c, i) => ({
      document_id:  doc.id,
      chunk_index:  i,
      content:      c.content,
      token_count:  c.token_count,
      embedding:    embeddings[i],
    }));
    // Insert in batches of 100 to stay under Supabase row-size limits for
    // the combined payload (1536 floats × 100 = 614k values, JSON encoded
    // this is ~3–4 MB which is comfortably under the 6 MB body cap).
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error: insErr } = await sb.from("vault_chunks").insert(rows.slice(i, i + BATCH));
      if (insErr) throw new Error(`chunk insert failed: ${insErr.message}`);
    }

    // 6. READY — update document with stats + clear raw_text to save space.
    const { error: upErr } = await sb
      .from("vault_documents")
      .update({
        status:       "ready",
        status_error: null,
        char_count:   extraction.char_count,
        chunk_count:  chunks.length,
        token_count:  total_tokens,
        raw_text:     null,
      })
      .eq("id", doc.id);
    if (upErr) throw new Error(`document update failed: ${upErr.message}`);

    return {
      ok:          true,
      document_id: doc.id,
      chunks:      chunks.length,
      tokens:      total_tokens,
      model,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sb
      .from("vault_documents")
      .update({ status: "failed", status_error: msg })
      .eq("id", doc.id);
    throw err;
  }
}

/* ─── Extract dispatch ───────────────────────────────────────────────────── */

async function runExtract(
  sb: ReturnType<typeof createClient>,
  doc: DocumentRow,
  ctx: Ctx,
): Promise<{ text: string; char_count: number; title?: string }> {
  switch (doc.kind) {
    case "paste": {
      // Paste rows always have their text pre-filled in raw_text by the API
      // route. The migration also populates raw_text for existing rows.
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

async function downloadFromStorage(
  sb: ReturnType<typeof createClient>,
  path: string,
): Promise<Uint8Array> {
  const { data, error } = await sb.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  const buf = await data.arrayBuffer();
  return new Uint8Array(buf);
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

async function setStatus(
  sb: ReturnType<typeof createClient>,
  id: string,
  status: string,
) {
  await sb.from("vault_documents").update({ status }).eq("id", id);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
