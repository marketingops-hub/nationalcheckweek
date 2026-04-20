/* ═══════════════════════════════════════════════════════════════════════════
 * Vault retrieval helpers for the Content Creator edge function.
 *
 * VAULT is the source of truth. Every AI call (ideas / generation / verify)
 * receives a bundle of vault_content rows pulled by this module. We use
 * keyword + category matching today; swap to pgvector embeddings later by
 * replacing the body of `fetchVaultContext` — the contract stays the same.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Surface type — the subset of vault_content fields the AI prompts consume.
export interface VaultEntry {
  id: string;
  title: string;
  content: string;
  source: string;       // denormalised URL or citation (vault_content.source)
  category: string;
}

/**
 * Fetch vault entries relevant to a brief.
 *
 * Strategy (v1, keyword-based):
 *   1. If `vault_category` is provided, narrow by category.
 *   2. Score each row by keyword hits in title + content (case-insensitive).
 *   3. Return top N rows, sorted by score then recency.
 *
 * Hard cap `limit` so we never blow past the model's context window.
 */
export async function fetchVaultContext(
  sbUrl: string,
  sbKey: string,
  opts: {
    keywords?: string[];
    vault_category?: string;
    topic?: string;
    limit?: number;
  },
): Promise<VaultEntry[]> {
  const limit = opts.limit ?? 25;
  const sb = createClient(sbUrl, sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let query = sb
    .from("vault_content")
    .select("id, title, content, source, category")
    .eq("is_approved", true);

  if (opts.vault_category) {
    query = query.eq("category", opts.vault_category);
  }

  // Pull a generous slice, then score client-side. Could switch to tsvector
  // ranking once the vault grows past ~1000 rows.
  const { data, error } = await query.order("updated_at", { ascending: false }).limit(200);
  if (error) throw new Error(`vault_content fetch failed: ${error.message}`);
  if (!data || data.length === 0) return [];

  const needles = buildNeedles(opts.keywords, opts.topic);
  if (needles.length === 0) {
    // No keywords to score — return most recent approved rows.
    return data.slice(0, limit) as VaultEntry[];
  }

  const scored = (data as VaultEntry[]).map((row) => {
    const hay = `${row.title}\n${row.content}`.toLowerCase();
    let score = 0;
    for (const n of needles) {
      if (hay.includes(n)) score += 1;
      // Title hits weight more.
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

/** Normalise keyword + topic inputs into a dedup'd lowercase array. */
function buildNeedles(keywords: string[] | undefined, topic: string | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (s: string) => {
    const v = s.trim().toLowerCase();
    if (v.length >= 3 && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  };
  (keywords ?? []).forEach(push);
  if (topic) {
    // Split topic into individual words too.
    topic.split(/\s+/).forEach(push);
    push(topic);
  }
  return out;
}

/** Render vault entries as a compact block to paste into a system prompt. */
export function formatVaultContext(entries: VaultEntry[]): string {
  if (entries.length === 0) {
    return "(no vault entries matched this brief — the model MUST decline to generate factual claims)";
  }
  return entries
    .map(
      (e, i) =>
        `[${i + 1}] id=${e.id} | category=${e.category}\nTITLE: ${e.title}\nCONTENT: ${e.content}\nSOURCE: ${e.source}`,
    )
    .join("\n---\n");
}
