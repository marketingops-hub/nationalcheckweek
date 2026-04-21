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

export interface ResolvedStyle {
  id:    string;
  title: string;
  prompt: string;
}

export async function resolveStylePrompt(
  sbUrl:    string,
  sbKey:    string,
  styleId?: string | null,
): Promise<ResolvedStyle | undefined> {
  if (!styleId || !/^[0-9a-f-]{36}$/i.test(styleId)) return undefined;

  const sb = createClient(sbUrl, sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await sb
    .from("content_writing_styles")
    .select("id, title, prompt, is_active")
    .eq("id", styleId)
    .maybeSingle();

  if (error) {
    console.warn("[content-creator/styles] fetch failed", error.message);
    return undefined;
  }
  if (!data || !data.is_active) return undefined;

  return { id: data.id, title: data.title, prompt: data.prompt };
}
