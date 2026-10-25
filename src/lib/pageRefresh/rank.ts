import { groupChunks, type GroupedDoc, type GroupOptions, type RetrievedChunk } from "./group";

const WORD = /[a-z][a-z'-]{3,}/g;
const NUMBER = /\d[\d,]*(?:\.\d+)?%?/g;

/** Words and figures worth matching: figures count triple, being the claims we must verify. */
function weightedTokens(text: string): Map<string, number> {
  const t = new Map<string, number>();
  const lower = text.toLowerCase();
  for (const w of lower.match(WORD) ?? []) t.set(w, 1);
  for (const n of lower.match(NUMBER) ?? []) {
    const k = n.replace(/,/g, "");
    if (k.endsWith("%") || k.includes(".") || k.replace(/\D/g, "").length >= 2) t.set(k, 3);
  }
  return t;
}

/** How many figures (percentages, counts of 10+) a passage contains. */
export function figureCount(text: string): number {
  return (text.match(/\d+(?:\.\d+)?\s?%|\b\d{2,}(?:,\d{3})*\b/g) ?? []).length;
}

/**
 * Pick the chunks of the given documents that best match `text` (the edited
 * proposal), by weighted keyword overlap. No embeddings are needed, so this
 * works on exactly the documents the reviewer ticked, however large.
 */
export function rankChunksForText(
  chunks: RetrievedChunk[],
  text: string,
  opts: GroupOptions & {
    /**
     * Favour passages that contain figures (percentages, counts). Used when
     * the goal is finding statistics to quote, so a results table beats an
     * introduction that merely uses the same words.
     */
    preferStats?: boolean;
  } = {},
): GroupedDoc[] {
  const { preferStats = false, ...groupOpts } = opts;
  const tokens = weightedTokens(text);
  if (tokens.size === 0) return [];

  const scored = chunks
    .map((chunk, order) => {
      const hay = chunk.content.toLowerCase().replace(/(\d),(\d)/g, "$1$2");
      let score = 0;
      for (const [token, weight] of tokens) if (hay.includes(token)) score += weight;
      // Only boost passages that are already on topic, so unrelated tables do not win.
      if (preferStats && score > 0) score += Math.min(6, figureCount(hay));
      return { chunk, order, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order);

  return groupChunks(
    scored.map((s) => s.chunk),
    { maxDocs: 12, perDoc: 4, ...groupOpts },
  );
}
