import type { SupabaseClient } from "@supabase/supabase-js";
import { RefreshError } from "./errors";
import type { RetrievedChunk } from "./group";

const PAGE = 1000;
const MAX_PAGES_PER_DOC = 8;

/** Every indexed chunk of the given documents (paged; capped per document). */
export async function fetchAllChunks(db: SupabaseClient, ids: string[], titles: Map<string, string>): Promise<RetrievedChunk[]> {
  const out: RetrievedChunk[] = [];
  for (const id of ids) {
    for (let page = 0; page < MAX_PAGES_PER_DOC; page++) {
      const { data, error } = await db
        .from("vault_chunks")
        .select("content, page, heading")
        .eq("document_id", id)
        .order("chunk_index", { ascending: true })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw new RefreshError(`Could not read vault documents: ${error.message}`, 500);
      for (const row of data ?? []) {
        out.push({
          document_id: id,
          document_title: titles.get(id) ?? "Untitled",
          chunk_page: (row.page as number | null) ?? null,
          chunk_heading: (row.heading as string | null) ?? null,
          content: row.content as string,
        });
      }
      if ((data ?? []).length < PAGE) break;
    }
  }
  return out;
}
