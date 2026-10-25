import { adminClient } from "@/lib/adminClient";
import { groupChunks } from "./group";
import { retrieveChunks } from "./retrieve";
import { RefreshError, loadDocMeta, toPreviewSource, type PreviewSource } from "./service";

export interface SearchResult extends PreviewSource {
  /** Short excerpts showing why the document matched. */
  snippets: string[];
}

/** Escape characters that are special in a PostgREST ilike filter. */
function likeEscape(q: string): string {
  return q.replace(/[%_,()\\]/g, " ").trim();
}

/**
 * Search the vault for documents to add as sources: by meaning/keywords in
 * the text (same search as the refresh) and by title. Only documents that are
 * indexed ('ready') are returned.
 */
export async function searchVaultSources(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 3) throw new RefreshError("Type at least 3 characters to search.", 400);
  const db = adminClient();

  let chunks;
  try {
    chunks = await retrieveChunks(db, q);
  } catch (err) {
    throw new RefreshError(err instanceof Error ? err.message : "Vault search failed.", 502);
  }
  const grouped = groupChunks(chunks, { maxDocs: 8, perDoc: 2, maxChunkChars: 320, maxTotalChars: 20000 });

  const title = likeEscape(q);
  const { data: byTitle } = title
    ? await db.from("vault_documents").select("id").eq("status", "ready").ilike("title", `%${title}%`).limit(6)
    : { data: [] as { id: string }[] };

  const ids = [...new Set([...grouped.map((g) => g.document_id), ...(byTitle ?? []).map((d) => d.id as string)])];
  const meta = await loadDocMeta(db, ids);
  const snippets = new Map(grouped.map((g) => [g.document_id, g.chunks.map((c) => c.content)]));

  return ids
    .filter((id) => meta.has(id))
    .map((id) => ({ ...toPreviewSource(meta.get(id)!, false), snippets: snippets.get(id) ?? [] }));
}
