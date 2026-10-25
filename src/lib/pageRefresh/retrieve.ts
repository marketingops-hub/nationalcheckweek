import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { looseQuery, type RetrievedChunk } from "./group";

const MATCH_K = 24;

/**
 * Retrieve vault chunks relevant to a query. Uses hybrid (semantic + keyword)
 * search when OPENAI_API_KEY is set, and falls back to full-text search so the
 * feature still works without embeddings. Only documents with status 'ready'
 * are ever searched.
 */
export async function retrieveChunks(db: SupabaseClient, query: string): Promise<RetrievedChunk[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const emb = await openai.embeddings.create({ model: "text-embedding-3-small", input: query });
      const { data, error } = await db.rpc("hybrid_match_vault_chunks", {
        query_embedding: emb.data[0].embedding,
        query_text: looseQuery(query),
        match_k: MATCH_K,
        category_filter: null,
      });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as {
        document_id: string;
        document_title: string;
        chunk_page: number | null;
        chunk_heading: string | null;
        content: string;
      }[];
      if (rows.length > 0) return rows;
    } catch (err) {
      console.warn("[page-refresh] semantic search failed, using full-text:", err instanceof Error ? err.message : err);
    }
  }
  return keywordChunks(db, query);
}

async function keywordChunks(db: SupabaseClient, query: string): Promise<RetrievedChunk[]> {
  const q = looseQuery(query);
  if (!q) return [];
  const { data, error } = await db
    .from("vault_chunks")
    .select("content, page, heading, document_id, vault_documents!inner(title, status)")
    .eq("vault_documents.status", "ready")
    .textSearch("content", q, { type: "websearch", config: "english" })
    .limit(MATCH_K);
  if (error) throw new Error(`Vault search failed: ${error.message}`);

  return (data ?? []).map((row) => {
    const rel = (row as { vault_documents: unknown }).vault_documents;
    const doc = (Array.isArray(rel) ? rel[0] : rel) as { title?: string } | undefined;
    return {
      document_id: row.document_id as string,
      document_title: doc?.title ?? "Untitled",
      chunk_page: (row.page as number | null) ?? null,
      chunk_heading: (row.heading as string | null) ?? null,
      content: row.content as string,
    };
  });
}
