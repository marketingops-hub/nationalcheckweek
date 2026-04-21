/* ═══════════════════════════════════════════════════════════════════════════
 * Writing-style fetcher for the content-creator edge functions.
 *
 * Reads a row from `content_writing_styles` and returns its prompt so the
 * caller can prepend it to the system message. Defensive:
 *
 *   - Missing id              → returns undefined (caller falls back to no style).
 *   - Row not found           → returns undefined (style might have been deleted).
 *   - is_active=false         → returns undefined (retired; treat as "no style").
 *   - DB error                → logs + returns undefined. The content chain
 *                               keeps working; losing a style is not worth
 *                               failing a $0.05 OpenAI call over.
 *
 * Why not throw? A missing or retired style is a UX concern, not a hard
 * error. The Next API layer could warn on the brief, but the edge fn's
 * job is to finish the draft.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface StyleExample {
  title?:  string;
  snippet: string;
}

export interface ResolvedStyle {
  id:         string;
  title:      string;
  prompt:     string;
  /** Content types this style applies to. ['all'] means unrestricted. */
  applies_to: string[];
  /** Up to 3 few-shot snippets. Empty array is valid (no block emitted). */
  examples:   StyleExample[];
}

export interface ResolveStyleOpts {
  /** When set, the style is dropped if its `applies_to` doesn't include
   *  this type or the 'all' wildcard. Matches the UI's filter. */
  contentType?: string;
}

export async function resolveStylePrompt(
  sbUrl:    string,
  sbKey:    string,
  styleId?: string | null,
  opts:     ResolveStyleOpts = {},
): Promise<ResolvedStyle | undefined> {
  if (!styleId || !/^[0-9a-f-]{36}$/i.test(styleId)) return undefined;

  const sb = createClient(sbUrl, sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await sb
    .from("content_writing_styles")
    .select("id, title, prompt, is_active, applies_to, examples")
    .eq("id", styleId)
    .maybeSingle();

  if (error) {
    console.warn("[content-creator/styles] fetch failed", error.message);
    return undefined;
  }
  if (!data || !data.is_active) return undefined;

  // applies_to / examples columns were added in the Apr-2026 scope+examples
  // migration. Fall back to sensible defaults so a pre-migration DB (or a
  // row written by an older client) still resolves cleanly.
  const appliesTo: string[] = Array.isArray(data.applies_to) && data.applies_to.length > 0
    ? data.applies_to
    : ['all'];
  const examples:  StyleExample[] = Array.isArray(data.examples)
    ? data.examples.filter((e: unknown): e is StyleExample =>
        !!e && typeof e === 'object' && typeof (e as StyleExample).snippet === 'string')
    : [];

  // Silent drop if this style no longer applies to the requested content
  // type. 'all' always matches. The UI filters the dropdown but a stale
  // brief could still carry an orphan style_id after the admin narrowed
  // applies_to — this is the defensive backstop.
  if (opts.contentType
      && !appliesTo.includes('all')
      && !appliesTo.includes(opts.contentType)) {
    return undefined;
  }

  return {
    id:         data.id,
    title:      data.title,
    prompt:     data.prompt,
    applies_to: appliesTo,
    examples,
  };
}

/**
 * Render up to 3 style examples as a STYLE EXAMPLES block that sits below
 * the WRITING STYLE directive. Returns an empty string when there are no
 * examples, so callers can unconditionally interpolate.
 *
 * Shape is intentionally terse (numbered, optional title, blank line
 * between) so it reads as few-shot anchors rather than a spec — we want
 * the model to absorb tone, not copy structure. Bounded length is
 * guaranteed upstream (DB CHECK = 4 KB on the row; Zod caps each snippet
 * at 500 chars; max 3 entries), so no truncation needed here.
 */
export function buildStyleExamplesBlock(examples: StyleExample[]): string {
  if (!examples || examples.length === 0) return "";
  const items = examples.slice(0, 3).map((ex, i) => {
    const heading = ex.title ? `#${i + 1} — ${ex.title}` : `#${i + 1}`;
    return `${heading}\n${ex.snippet.trim()}`;
  });
  return `STYLE EXAMPLES (match this tone and cadence — do not copy the wording)\n${items.join("\n\n")}`;
}
