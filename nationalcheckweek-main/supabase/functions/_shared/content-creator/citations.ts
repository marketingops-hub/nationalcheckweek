/* ═══════════════════════════════════════════════════════════════════════════
 * Citations post-processor.
 *
 * AI output contains inline `[vault:<uuid>]` markers because the edge-fn
 * prompts explicitly ask for traceable claims. The UUID form is great for
 * machine audit (and the verifier stage) but useless to a human reader.
 *
 * This module transforms the raw body into a reader-friendly shape:
 *
 *   1. Each unique uuid encountered (in order of first appearance) is
 *      assigned a sequential number [1], [2], …
 *   2. Every `[vault:<uuid>]` is replaced in-place with `[Source N]` for
 *      blog/newsletter (verbose, reads well in long-form) or `[N]` for
 *      social (character-budget sensitive).
 *   3. For blog/newsletter only, a "Sources" block is appended at the end
 *      listing each numbered source with title + URL/source.
 *
 * Why this runs post-generation (not inside the prompt):
 *   - The AI doesn't know what number to assign until we see the whole doc.
 *   - It's dramatically cheaper to transform strings than burn tokens on
 *     formatting instructions.
 *   - Keeps the verifier stage simple — it still sees the original uuids.
 *
 * IMPORTANT: this file is mirrored at
 *   supabase/functions/_shared/content-creator/citations.ts
 * because Deno edge fns can't import from `src/`. Keep them in sync.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface CitationVaultEntry {
  id:     string;
  title?: string | null;
  source?: string | null;   // URL, doc kind, or free text
}

export interface FormatCitationsResult {
  /** Body with `[vault:<uuid>]` replaced and (for long-form) a Sources block appended. */
  body: string;

  /**
   * Uuids in the order they were numbered ([0] = Source 1). Persist this so
   * the detail-page UI can render links and the verifier can map numbers
   * back to vault ids without re-scanning the body.
   */
  ordered_vault_ids: string[];

  /** Same length as ordered_vault_ids; the `[N]` style used for this content_type. */
  citation_style: 'verbose' | 'compact';
}

const VAULT_MARKER = /\[vault:([0-9a-f-]{36})\]/gi;

/**
 * Regex that detects an AI-authored Sources / References section at the end
 * of the body. We consider it "present" if any of these appear near the
 * tail of the document (last 40% of lines) on their own line:
 *
 *   - `## Sources` / `## References`    (markdown heading variant)
 *   - `Sources:`  / `References:`       (label variant)
 *   - `---` followed by `Sources:`      (our own post-processor format —
 *                                        makes the check idempotent if
 *                                        formatCitations is ever called twice)
 *
 * Case-insensitive, trimmed per-line. Anchoring near the tail avoids
 * false positives when "sources" appears in the body prose.
 */
const SOURCES_HEADING = /^(?:#{1,6}\s*)?(sources|references)\s*:?\s*$/i;

/**
 * Main entrypoint. `content_type` controls the in-body marker style and
 * whether a Sources block is appended.
 *
 *   - blog / newsletter → [Source N] + Sources block at end
 *   - social            → [N]         + NO sources block (character budget)
 *
 * Returns the transformed body plus an ordered list of the uuids used so
 * that downstream (UI, verifier) doesn't have to re-parse.
 */
export function formatCitations(
  body: string,
  vault: CitationVaultEntry[],
  content_type: 'social' | 'blog' | 'newsletter',
): FormatCitationsResult {
  // Build a lookup the transform can use without O(n²) scans.
  const byId = new Map<string, CitationVaultEntry>();
  for (const v of vault) byId.set(v.id.toLowerCase(), v);

  // First pass: number uuids in order of first appearance. We don't mutate
  // the body yet — we just build the mapping so both the replace-pass and
  // the Sources-block pass share a single source of truth.
  const ordering = new Map<string, number>();   // uuid lowercased → 1-indexed position
  const uniqueOrder: string[] = [];
  for (const m of body.matchAll(VAULT_MARKER)) {
    const id = m[1].toLowerCase();
    if (!ordering.has(id)) {
      ordering.set(id, ordering.size + 1);
      uniqueOrder.push(id);
    }
  }

  // No citations → body is already fine. Early-return avoids a useless
  // append of an empty Sources block.
  if (uniqueOrder.length === 0) {
    return { body, ordered_vault_ids: [], citation_style: content_type === 'social' ? 'compact' : 'verbose' };
  }

  const verbose = content_type !== 'social';

  // Second pass: replace every marker. `[Source N]` for long-form (clear
  // for readers), `[N]` for social (280-char budget).
  const replaced = body.replace(VAULT_MARKER, (_m, uuid: string) => {
    const n = ordering.get(uuid.toLowerCase());
    if (!n) return '';                     // shouldn't happen; defensive
    return verbose ? `[Source ${n}]` : `[${n}]`;
  });

  // Long-form pieces get a reference list at the end. Social posts don't
  // because even 30 chars of "[1] URL" blows Twitter/Instagram budgets.
  //
  // Dedupe: if the AI already wrote its own Sources / References heading
  // near the tail of the body, we skip the append. This covers two cases:
  //   (a) a well-behaved model writing its own refs section despite the
  //       prompt asking for inline markers only
  //   (b) idempotency if formatCitations gets called twice on the same
  //       body (e.g. a regen that pulls the pre-formatted body back in
  //       as "previous_draft" and then runs through the post-processor
  //       again — unlikely today but cheap insurance).
  let out = replaced;
  if (verbose && !hasTrailingSourcesBlock(replaced)) {
    const lines = uniqueOrder.map((id, i) => {
      const e = byId.get(id);
      const title = (e?.title  ?? '').trim() || 'Untitled source';
      const src   = (e?.source ?? '').trim();
      // If source is a URL, render as a plain URL so the detail UI can
      // linkify it; otherwise render the free text (e.g. "Mission
      // Australia Youth Survey 2024").
      return src
        ? `[${i + 1}] ${title} — ${src}`
        : `[${i + 1}] ${title}`;
    });
    // Trim trailing whitespace before appending so we don't end up with
    // three blank lines.
    out = `${out.trimEnd()}\n\n---\nSources:\n${lines.join('\n')}`;
  }

  return {
    body:              out,
    ordered_vault_ids: uniqueOrder,
    citation_style:    verbose ? 'verbose' : 'compact',
  };
}

/**
 * True when the last 40% of the body contains a line matching
 * SOURCES_HEADING or a literal `---` divider followed by `Sources:`.
 * The 40% tail window is important — we don't want "References:" in
 * body prose to block the append.
 */
function hasTrailingSourcesBlock(body: string): boolean {
  const lines = body.split('\n');
  if (lines.length === 0) return false;
  const tailStart = Math.floor(lines.length * 0.6);
  for (let i = tailStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (SOURCES_HEADING.test(line)) return true;
  }
  return false;
}
