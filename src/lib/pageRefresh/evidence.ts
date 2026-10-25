/**
 * Evidence checks for proposed content. The model must back every changed
 * field with verbatim quotes from the excerpts it was given; these helpers
 * verify that the quotes really exist and that new figures are traceable, so
 * a reviewer can see at a glance what is and isn't supported.
 */

export interface RawEvidence {
  source: number;
  quote: string;
}

/** Lower-case, unify quotes/dashes, collapse whitespace, drop markdown noise. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/[*_`#>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the quote appears in the text (ignoring case, spacing and quote style). */
export function quoteInText(quote: string, text: string): boolean {
  const q = normalizeText(quote).replace(/^[.…\s]+|[.…\s]+$/g, "");
  if (q.length < 12) return false; // too short to be meaningful evidence
  return normalizeText(text).includes(q);
}

/** Remove "(Source: …)" citations so their wording is not mistaken for claims. */
export function stripCitations(text: string): string {
  return text.replace(/\(\s*source:[^)]*\)/gi, " ");
}

const NUMBER_RE = /\d[\d,]*(?:\.\d+)?\s?%?/g;

function numberTokens(text: string): string[] {
  const out = new Set<string>();
  for (const m of stripCitations(text).matchAll(NUMBER_RE)) {
    const token = m[0].replace(/[\s,]/g, "");
    // Ignore single digits ("1 in 5", "2 weeks"): too noisy to check. Keep
    // percentages, decimals and anything with two or more digits.
    if (token.endsWith("%") || token.includes(".") || token.replace(/\D/g, "").length >= 2) out.add(token);
  }
  return [...out];
}

/**
 * Figures that appear in the proposed text, are new (not already in the
 * current text) and cannot be found in the source excerpts.
 */
export function unsupportedFigures(proposed: string, current: string, excerpts: string): string[] {
  const have = new Set(numberTokens(current));
  const haystack = normalizeText(excerpts).replace(/(\d),(\d)/g, "$1$2").replace(/\s%/g, "%");
  return numberTokens(proposed).filter((t) => !have.has(t) && !haystack.includes(t.toLowerCase()));
}

/* ── Putting it together for the review screen ──────────────────────────── */

export interface EvidenceItem {
  /** vault document the quote was found in */
  sourceId: string;
  label: string;
  url: string | null;
  page: number | null;
  heading: string | null;
  quote: string;
  /** true when the quote was found word-for-word in the document's retrieved text */
  verified: boolean;
}

interface EvidenceDoc {
  document_id: string;
  chunks: { chunk_page?: number | null; chunk_heading?: string | null; content: string }[];
}

/** All the text values inside a field (strings, lists, objects), joined. */
export function fieldText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(fieldText).join(" ");
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).map(fieldText).join(" ");
  return "";
}

export function reviewEvidence(args: {
  changed: string[];
  fieldLabels: Record<string, string>;
  current: Record<string, unknown>;
  proposed: Record<string, unknown>;
  /** documents in prompt order: raw evidence `source` n refers to docs[n - 1] */
  docs: EvidenceDoc[];
  raw: Record<string, RawEvidence[]>;
  describe: (documentId: string) => { label: string; url: string | null };
  /** Full text of the documents. When given, new figures are checked against it instead of the excerpts. */
  fullText?: string;
}): { evidence: Record<string, EvidenceItem[]>; unsupported: Record<string, string[]>; warnings: string[] } {
  const evidence: Record<string, EvidenceItem[]> = {};
  const unsupported: Record<string, string[]> = {};
  const warnings: string[] = [];
  const excerpts = args.fullText ?? args.docs.flatMap((d) => d.chunks.map((c) => c.content)).join("\n");
  let unverified = 0;

  for (const field of args.changed) {
    const name = args.fieldLabels[field] ?? field;
    const items: EvidenceItem[] = [];

    for (const raw of args.raw[field] ?? []) {
      // Look in the document the model named first, then in the others (it may
      // have mis-numbered). Credit the document that really contains the quote.
      const named = args.docs[raw.source - 1];
      const ordered = [named, ...args.docs.filter((d) => d !== named)].filter(Boolean) as EvidenceDoc[];
      let found: { doc: EvidenceDoc; chunk: EvidenceDoc["chunks"][number] } | null = null;
      for (const doc of ordered) {
        const chunk = doc.chunks.find((c) => quoteInText(raw.quote, c.content));
        if (chunk) {
          found = { doc, chunk };
          break;
        }
      }
      const doc = found?.doc ?? named;
      if (!doc) continue;
      const d = args.describe(doc.document_id);
      if (!found) unverified++;
      items.push({
        sourceId: doc.document_id,
        label: d.label,
        url: d.url,
        page: found?.chunk.chunk_page ?? null,
        heading: found?.chunk.chunk_heading ?? null,
        quote: raw.quote,
        verified: Boolean(found),
      });
    }

    evidence[field] = items;
    if (items.length === 0) {
      warnings.push(`"${name}" has no supporting quote from the documents. Check it against the source before publishing.`);
    }

    const missing = unsupportedFigures(fieldText(args.proposed[field]), fieldText(args.current[field]), excerpts);
    if (missing.length) {
      unsupported[field] = missing;
      warnings.push(`"${name}" contains figures that were not found in the selected documents: ${missing.join(", ")}.`);
    }
  }

  if (unverified > 0) {
    warnings.push(
      `${unverified} quote${unverified > 1 ? "s" : ""} could not be found word-for-word in the documents. Treat the related text as unverified.`,
    );
  }
  return { evidence, unsupported, warnings };
}
