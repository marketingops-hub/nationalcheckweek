/* ═══════════════════════════════════════════════════════════════════════════
 * Vault retrieval helpers for the Content Creator edge function.
 *
 * Strategy — two-tier retrieval:
 *
 *   1. PRIMARY  — semantic search via pgvector:
 *      build a query embedding from topic + keywords → match_vault_chunks()
 *      RPC returns top-k most similar chunks by cosine similarity.
 *
 *   2. FALLBACK — keyword scoring over vault_content (the legacy paste-only
 *      table). Triggered when:
 *        • OpenAI embedding call fails, OR
 *        • match_vault_chunks returns 0 results (empty new vault), OR
 *        • OPENAI_API_KEY is missing.
 *
 *      Keeps the pipeline alive during the rollout window when vault_content
 *      has data but vault_documents is still empty / mid-backfill.
 *
 * Return shape is stable (`VaultEntry[]`) — prompt builders don't care which
 * path produced the data.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface VaultEntry {
  id:       string;      // chunk id (new path) or vault_content id (fallback)
  title:    string;      // document title
  content:  string;      // the actual text the prompt will read
  source:   string;      // URL, filename, or citation
  category: string;      // kept for compatibility; ignored in the new path
}

interface FetchOpts {
  keywords?:       string[];
  vault_category?: string;
  topic?:          string;
  limit?:          number;
  /**
   * When true AND no topic/keywords are supplied, pulls a diverse sample
   * of chunks from the category instead of failing. Used by the Topic
   * Generator in "surprise me" mode where the admin hasn't given a seed.
   */
  allow_broad_sample?: boolean;
}

const DEFAULT_LIMIT = 12;
const EMBED_MODEL   = "text-embedding-3-small";
// Minimum cosine similarity to keep a chunk — tuned empirically. Below 0.2
// the matches tend to be garbage; 0.3–0.5 is the sweet spot for focused
// topics. 0.22 is permissive enough for short briefs while still filtering
// obvious noise.
const MIN_SIMILARITY = 0.22;

export async function fetchVaultContext(
  sbUrl: string,
  sbKey: string,
  opts: FetchOpts,
): Promise<VaultEntry[]> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const sb = createClient(sbUrl, sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ─── Primary: embedding-based similarity search ──────────────────────
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (openaiKey) {
    try {
      const query = buildQueryString(opts);
      if (query.length > 0) {
        const embedding = await embed(openaiKey, query);
        const { data, error } = await sb.rpc("match_vault_chunks", {
          query_embedding: embedding,
          match_k:         limit,
          min_similarity:  MIN_SIMILARITY,
          category_filter: opts.vault_category ?? null,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(rowToEntry);
        }
        // error OR 0 rows → fall through to keyword fallback.
      }
    } catch (err) {
      // Swallow and fall back. Log for observability; don't blow up generation.
      console.error("[vault] semantic search failed, falling back:", err instanceof Error ? err.message : err);
    }
  }

  // ─── Broad sample (topic-generator fallback) ──────────────────────────
  // When the caller opted in AND there's no seed, sample chunks from the
  // requested category so the Topic Generator has something to work with
  // even without an embedding query.
  if (opts.allow_broad_sample && buildQueryString(opts).length === 0) {
    const broad = await broadSample(sb, opts.vault_category, limit);
    if (broad.length > 0) return broad;
  }

  // ─── Fallback: keyword scoring over vault_content ─────────────────────
  return await keywordFallback(sb, opts, limit);
}

/** Pull a diverse sample from the new vault_chunks table for no-seed runs. */
async function broadSample(
  sb: ReturnType<typeof createClient>,
  vault_category: string | undefined,
  limit: number,
): Promise<VaultEntry[]> {
  // Strategy: pull most recent chunks from the category (up to 4x limit)
  // and then shuffle client-side so each generation run gets a different
  // slice without a full random-on-DB table scan.
  let q = sb
    .from("vault_chunks")
    .select("id, content, vault_documents!inner(id, title, source, kind, category, status)")
    .eq("vault_documents.status", "ready")
    .order("created_at", { ascending: false })
    .limit(limit * 4);

  if (vault_category && vault_category !== "all") {
    q = q.eq("vault_documents.category", vault_category);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[vault] broadSample failed:", error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Fisher-Yates-ish shuffle and take `limit`. Cheap and deterministic-enough.
  const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, limit);

  return shuffled.map((row) => {
    const doc = Array.isArray(row.vault_documents) ? row.vault_documents[0] : row.vault_documents;
    return {
      id:       row.id as string,
      title:    doc?.title ?? "Untitled",
      content:  row.content as string,
      source:   doc?.source ?? doc?.kind ?? "",
      category: doc?.category ?? "general",
    };
  });
}

/* ─── Embedding helper ───────────────────────────────────────────────────── */

async function embed(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) {
    throw new Error(`openai embeddings ${res.status}: ${await res.text().then((s) => s.slice(0, 200))}`);
  }
  const payload = await res.json() as { data: { embedding: number[] }[] };
  if (!payload.data?.[0]?.embedding) throw new Error("openai returned no embedding");
  return payload.data[0].embedding;
}

/** Combine topic + keywords into a single query string for embedding. */
function buildQueryString(opts: FetchOpts): string {
  const parts: string[] = [];
  if (opts.topic)    parts.push(opts.topic);
  if (opts.keywords?.length) parts.push(opts.keywords.join(", "));
  return parts.join(". ").trim();
}

/* ─── RPC row → VaultEntry ───────────────────────────────────────────────── */

interface MatchRow {
  chunk_id:         string;
  document_id:      string;
  document_title:   string;
  document_source:  string | null;
  document_kind:    string;
  content:          string;
  similarity:       number;
}

function rowToEntry(row: MatchRow): VaultEntry {
  return {
    id:       row.chunk_id,
    title:    row.document_title,
    content:  row.content,
    source:   row.document_source ?? row.document_kind,
    // match_vault_chunks doesn't return category — it's already been filtered
    // server-side if a category_filter was passed.
    category: "general",
  };
}

/* ─── Fallback: legacy keyword retriever ────────────────────────────────── */

async function keywordFallback(
  sb: ReturnType<typeof createClient>,
  opts: FetchOpts,
  limit: number,
): Promise<VaultEntry[]> {
  let query = sb
    .from("vault_content")
    .select("id, title, content, source, category")
    .eq("is_approved", true);

  if (opts.vault_category) query = query.eq("category", opts.vault_category);

  const { data, error } = await query.order("updated_at", { ascending: false }).limit(200);
  if (error) throw new Error(`vault_content fallback failed: ${error.message}`);
  if (!data || data.length === 0) return [];

  const needles = buildNeedles(opts.keywords, opts.topic);
  if (needles.length === 0) return (data as VaultEntry[]).slice(0, limit);

  const scored = (data as VaultEntry[]).map((row) => {
    const hay = `${row.title}\n${row.content}`.toLowerCase();
    let score = 0;
    for (const n of needles) {
      if (hay.includes(n)) score += 1;
      if (row.title.toLowerCase().includes(n)) score += 2;
    }
    return { row, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.row);
}

function buildNeedles(keywords: string[] | undefined, topic: string | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (s: string) => {
    const v = s.trim().toLowerCase();
    if (v.length >= 3 && !seen.has(v)) { seen.add(v); out.push(v); }
  };
  (keywords ?? []).forEach(push);
  if (topic) {
    topic.split(/\s+/).forEach(push);
    push(topic);
  }
  return out;
}

/* ─── Prompt formatter (unchanged signature) ─────────────────────────────── */

export function formatVaultContext(entries: VaultEntry[]): string {
  if (entries.length === 0) {
    return "(No vault entries matched the brief. Treat claims as provisional.)";
  }
  return entries
    .map((e, i) => `[V${i + 1}] ${e.title}\nsource: ${e.source}\nid: ${e.id}\n${e.content}`)
    .join("\n\n---\n\n");
}
