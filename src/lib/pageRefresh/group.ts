export interface RetrievedChunk {
  document_id: string;
  document_title: string;
  chunk_page?: number | null;
  chunk_heading?: string | null;
  content: string;
}

export interface GroupedDoc {
  document_id: string;
  title: string;
  chunks: RetrievedChunk[];
}

export interface GroupOptions {
  maxDocs?: number;
  perDoc?: number;
  maxChunkChars?: number;
  maxTotalChars?: number;
}

/**
 * Group relevance-ordered chunks by document, keeping the prompt small:
 * documents stay in the order of their best chunk, each document keeps its
 * best few chunks, and the total text is capped.
 */
export function groupChunks(rows: RetrievedChunk[], opts: GroupOptions = {}): GroupedDoc[] {
  const { maxDocs = 6, perDoc = 4, maxChunkChars = 2500, maxTotalChars = 24000 } = opts;

  const byDoc = new Map<string, GroupedDoc>();
  for (const row of rows) {
    if (!row.content?.trim()) continue;
    let doc = byDoc.get(row.document_id);
    if (!doc) {
      if (byDoc.size >= maxDocs) continue;
      doc = { document_id: row.document_id, title: row.document_title, chunks: [] };
      byDoc.set(row.document_id, doc);
    }
    if (doc.chunks.length >= perDoc) continue;
    doc.chunks.push({ ...row, content: row.content.trim().slice(0, maxChunkChars) });
  }

  // Enforce the overall budget, dropping the lowest-ranked chunks first.
  const docs = [...byDoc.values()];
  let total = docs.reduce((n, d) => n + d.chunks.reduce((m, c) => m + c.content.length, 0), 0);
  for (let round = perDoc - 1; total > maxTotalChars && round >= 0; round--) {
    for (let i = docs.length - 1; i >= 0 && total > maxTotalChars; i--) {
      if (docs[i].chunks.length > round + 1 || (round === 0 && docs[i].chunks.length > 1)) {
        const removed = docs[i].chunks.pop();
        total -= removed?.content.length ?? 0;
      }
    }
  }
  return docs.filter((d) => d.chunks.length > 0);
}

/** Loose keyword query for full-text search: significant words joined with OR. */
export function looseQuery(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return [...new Set(words)].slice(0, 12).join(" or ");
}
