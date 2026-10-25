import { safeSourceUrl, sourceLabel, type SourceDoc } from "./format";

/** A numbered reference from the issue's own source list (issue_sources). */
export interface NumberedSource {
  id: string;
  num: number;
  title: string;
  url: string | null;
  publisher?: string | null;
  year?: string | number | null;
  verified?: boolean | null;
}

/** A vault document shown as a source (from get_page_sources). */
export interface VaultSourceRow extends SourceDoc {
  document_id: string;
}

export interface MergedSources {
  /** The numbered references, with a missing link filled in from the vault when the same document is there. */
  numbered: NumberedSource[];
  /** Vault documents that are not already in the numbered list, de-duplicated, in the order given. */
  extras: { id: string; label: string; url: string | null }[];
}

/** Lower-case letters and digits only, so punctuation and spacing differences don't matter. */
function plain(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** "example.com/path" for "https://www.Example.com/path/?x=1#top". */
function plainUrl(url: string | null | undefined): string {
  const u = safeSourceUrl(url);
  if (!u) return "";
  const parsed = new URL(u);
  return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}`.toLowerCase();
}

/** The same document: same link, or same title (or one title inside the other, when long enough to be meaningful). */
function sameDocument(aTitle: string, aUrl: string | null | undefined, bTitle: string, bUrl: string | null | undefined): boolean {
  const ua = plainUrl(aUrl);
  const ub = plainUrl(bUrl);
  if (ua && ub && ua === ub) return true;
  const ta = plain(aTitle);
  const tb = plain(bTitle);
  if (!ta || !tb) return false;
  if (ta === tb) return true;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return short.length >= 12 && long.includes(short);
}

/**
 * One source list for a page: the numbered references first (their numbers are
 * used by the [n] citations in the text, so they never change), then any vault
 * documents that are not already listed.
 */
export function mergeSources(numbered: NumberedSource[], vault: VaultSourceRow[]): MergedSources {
  const filled = numbered.map((n) => ({ ...n }));
  const extras: MergedSources["extras"] = [];
  const seenDocs = new Set<string>();

  for (const row of vault) {
    if (seenDocs.has(row.document_id)) continue;
    seenDocs.add(row.document_id);

    const url = safeSourceUrl(row.source_url);
    const match = filled.find((n) => sameDocument(n.title, n.url, row.title, url));
    if (match) {
      if (!safeSourceUrl(match.url) && url) match.url = url;
      continue;
    }
    const already = extras.find((e) => sameDocument(e.label, e.url, row.title, url) || sameDocument(e.label, e.url, sourceLabel(row), url));
    if (already) {
      if (!already.url && url) already.url = url;
      continue;
    }
    extras.push({ id: row.document_id, label: sourceLabel(row), url });
  }

  return { numbered: filled, extras };
}
