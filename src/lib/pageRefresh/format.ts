/**
 * Formatting of vault documents as footer sources. Used by the public page
 * footer and the admin review screen so both show exactly the same thing.
 */
export interface SourceDoc {
  title: string;
  reference?: string | null;
  author?: string | null;
  publisher?: string | null;
  year?: string | number | null;
  page_ref?: string | null;
  source_url?: string | null;
}

const clean = (v: string | number | null | undefined) => (v == null ? "" : String(v).trim());

/** Only http(s) links are ever rendered as links. */
export function safeSourceUrl(url: string | null | undefined): string | null {
  const u = clean(url);
  if (!/^https?:\/\//i.test(u)) return null;
  try {
    return new URL(u).toString();
  } catch {
    return null;
  }
}

/** Human-readable reference: the explicit `reference` if set, else author (year). title. publisher. */
export function sourceLabel(doc: SourceDoc): string {
  const reference = clean(doc.reference);
  const base = reference || composeReference(doc);
  const page = clean(doc.page_ref);
  return page ? `${base}, ${page}` : base;
}

function composeReference(doc: SourceDoc): string {
  const author = clean(doc.author);
  const year = clean(doc.year);
  const title = clean(doc.title) || "Untitled document";
  const publisher = clean(doc.publisher);

  const head = author ? (year ? `${author} (${year}).` : `${author}.`) : "";
  const tail = [title, publisher].filter(Boolean).join(". ");
  const text = [head, tail].filter(Boolean).join(" ");
  return !head && year ? `${text} (${year})` : text;
}
