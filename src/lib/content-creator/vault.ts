/* ═══════════════════════════════════════════════════════════════════════════
 * Node-side Vault retrieval for simple-content and other server routes.
 *
 * Ports the two-tier strategy from the edge-fn _shared/content-creator/vault.ts
 * for use in Next.js API routes (Node runtime):
 *
 *   1. PRIMARY  — semantic search via pgvector (match_vault_chunks RPC)
 *   2. FALLBACK — keyword scoring over vault_content
 *
 * Return shape is identical to the edge version so callers don't care
 * which path ran.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { adminClient } from '@/lib/adminClient';

export interface VaultEntry {
  id:       string;
  title:    string;
  content:  string;
  source:   string;
  category: string;
}

interface FetchOpts {
  topic?:             string;
  keywords?:          string[];
  vault_category?:    string;
  limit?:             number;
  allow_broad_sample?: boolean;
}

const DEFAULT_LIMIT  = 12;
const MIN_SIMILARITY = 0.22;
const EMBED_MODEL    = 'text-embedding-3-small';

export async function fetchVaultContext(opts: FetchOpts): Promise<VaultEntry[]> {
  const sb    = adminClient();
  const limit = opts.limit ?? DEFAULT_LIMIT;

  // ── Primary: embedding similarity search ──────────────────────────────
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const query = buildQueryString(opts);
      if (query.length > 0) {
        const embedding = await embed(openaiKey, query);
        const { data, error } = await sb.rpc('match_vault_chunks', {
          query_embedding: embedding,
          match_k:         limit,
          min_similarity:  MIN_SIMILARITY,
          category_filter: opts.vault_category ?? null,
        });
        if (!error && Array.isArray(data) && data.length > 0) {
          return (data as MatchRow[]).map(rowToEntry);
        }
      }
    } catch (err) {
      console.error('[vault] semantic search failed, falling back:', err instanceof Error ? err.message : err);
    }
  }

  // ── Broad sample (no-seed fallback) ───────────────────────────────────
  if (opts.allow_broad_sample && buildQueryString(opts).length === 0) {
    const broad = await broadSample(sb, opts.vault_category, limit);
    if (broad.length > 0) return broad;
  }

  // ── Keyword scoring over vault_content ────────────────────────────────
  return keywordFallback(sb, opts, limit);
}

export function formatVaultContext(entries: VaultEntry[]): string {
  if (entries.length === 0) {
    return '(No vault entries matched the brief. Treat claims as provisional.)';
  }
  return entries
    .map((e, i) => `[V${i + 1}] ${e.title}\nsource: ${e.source}\nid: ${e.id}\n${e.content}`)
    .join('\n\n---\n\n');
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

async function embed(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings ${res.status}`);
  const payload = await res.json() as { data: { embedding: number[] }[] };
  if (!payload.data?.[0]?.embedding) throw new Error('No embedding returned');
  return payload.data[0].embedding;
}

function buildQueryString(opts: FetchOpts): string {
  const parts: string[] = [];
  if (opts.topic)            parts.push(opts.topic);
  if (opts.keywords?.length) parts.push(opts.keywords.join(', '));
  return parts.join('. ').trim();
}

interface MatchRow {
  chunk_id:        string;
  document_title:  string;
  document_source: string | null;
  document_kind:   string;
  content:         string;
}

function rowToEntry(row: MatchRow): VaultEntry {
  return {
    id:       row.chunk_id,
    title:    row.document_title,
    content:  row.content,
    source:   row.document_source ?? row.document_kind,
    category: 'general',
  };
}

async function broadSample(
  sb: ReturnType<typeof adminClient>,
  vault_category: string | undefined,
  limit: number,
): Promise<VaultEntry[]> {
  let q = sb
    .from('vault_chunks')
    .select('id, content, vault_documents!inner(id, title, source, kind, category, status)')
    .eq('vault_documents.status', 'ready')
    .order('created_at', { ascending: false })
    .limit(limit * 4);
  if (vault_category && vault_category !== 'all') {
    q = q.eq('vault_documents.category', vault_category) as typeof q;
  }
  const { data, error } = await q;
  if (error || !data?.length) return [];
  const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, limit);
  return shuffled.map((row) => {
    const doc = Array.isArray(row.vault_documents) ? row.vault_documents[0] : row.vault_documents;
    return {
      id:       row.id as string,
      title:    (doc as { title?: string })?.title ?? 'Untitled',
      content:  row.content as string,
      source:   (doc as { source?: string; kind?: string })?.source ?? (doc as { kind?: string })?.kind ?? '',
      category: (doc as { category?: string })?.category ?? 'general',
    };
  });
}

async function keywordFallback(
  sb: ReturnType<typeof adminClient>,
  opts: FetchOpts,
  limit: number,
): Promise<VaultEntry[]> {
  let q = sb
    .from('vault_content')
    .select('id, title, content, source, category')
    .eq('is_approved', true)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (opts.vault_category) q = q.eq('category', opts.vault_category) as typeof q;
  const { data, error } = await q;
  if (error || !data?.length) return [];

  const needles = buildNeedles(opts.keywords, opts.topic);
  if (needles.length === 0) return (data as VaultEntry[]).slice(0, limit);

  return (data as VaultEntry[])
    .map((row) => {
      const hay = `${row.title}\n${row.content}`.toLowerCase();
      let score = 0;
      for (const n of needles) {
        if (hay.includes(n)) score += 1;
        if (row.title.toLowerCase().includes(n)) score += 2;
      }
      return { row, score };
    })
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
  if (topic) { topic.split(/\s+/).forEach(push); push(topic); }
  return out;
}
