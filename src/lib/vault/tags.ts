/**
 * Tag helpers for the vault tag picker: staff choose from tags that already
 * exist, or type new ones.
 */
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 50;

export interface KnownTag {
  tag: string;
  count: number;
}

/** Trim, collapse spaces, drop commas, cap the length. */
export function cleanTag(raw: string): string {
  return raw.replace(/,/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH);
}

/**
 * Add one or more tags (`raw` may be "a, b" from a paste). New tags reuse the
 * spelling of an existing tag when they match ignoring case; duplicates are
 * dropped; the list is capped at MAX_TAGS. Returns the same array when nothing
 * was added.
 */
export function addTags(current: string[], raw: string, known: string[] = []): string[] {
  const canonical = new Map(known.map((k) => [k.toLowerCase(), k]));
  const next = [...current];
  const seen = new Set(next.map((t) => t.toLowerCase()));

  for (const piece of raw.split(",")) {
    const cleaned = cleanTag(piece);
    if (!cleaned || next.length >= MAX_TAGS) continue;
    const tag = canonical.get(cleaned.toLowerCase()) ?? cleaned;
    if (seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    next.push(tag);
  }
  return next.length === current.length ? current : next;
}

/** Existing tags not yet selected that match the typed text; prefix matches first, then by use. */
export function suggest(known: KnownTag[], selected: string[], query: string, limit = 8): KnownTag[] {
  const taken = new Set(selected.map((t) => t.toLowerCase()));
  const q = query.trim().toLowerCase();
  const pool = known.filter((k) => !taken.has(k.tag.toLowerCase()) && (q === "" || k.tag.toLowerCase().includes(q)));
  const rank = (k: KnownTag) => (q && k.tag.toLowerCase().startsWith(q) ? 0 : 1);
  return pool
    .map((k, i) => ({ k, i }))
    .sort((a, b) => rank(a.k) - rank(b.k) || a.i - b.i)
    .slice(0, limit)
    .map(({ k }) => k);
}

/** Distinct tags with usage counts, most used first (ties alphabetical, ignoring case). */
export function countTags(rows: { tags: string[] | null }[]): KnownTag[] {
  const byKey = new Map<string, KnownTag>();
  for (const row of rows) {
    for (const raw of row.tags ?? []) {
      const tag = cleanTag(String(raw));
      if (!tag) continue;
      const key = tag.toLowerCase();
      const entry = byKey.get(key);
      if (entry) entry.count++;
      else byKey.set(key, { tag, count: 1 });
    }
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "en", { sensitivity: "base" }));
}
