/* ═══════════════════════════════════════════════════════════════════════════
 * Edge Function: content-creator-topics — Stage 0
 *
 * Generates a backlog of content topic ideas from the Vault. This is the
 * pre-brief stage: the admin arrives with a loose category (or 'all'), we
 * retrieve relevant vault chunks, and OpenAI produces N catchy topics with
 * provenance (which documents inspired each one).
 *
 * Extracted from the previous monolithic `content-creator` function so this
 * stage can deploy, log, and fail independently.
 *
 * POST body:
 *   { vault_category: string, count?: number, seed?: string }
 *
 * Response:
 *   { topics: ContentTopic[] }  // inserted rows with status='draft'
 *
 * ENV: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · OPENAI_API_KEY
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchVaultContext, formatVaultContext } from "../_shared/content-creator/vault.ts";
import { buildTopicPrompt } from "../_shared/content-creator/prompts.ts";
import { callOpenAI } from "../_shared/content-creator/openai.ts";
import {
  corsHeaders, json, readCtx, requireAuth, safeParseJson,
  dedupStrings, dedupUuids, trim, type Ctx,
} from "../_shared/content-creator/common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authFail = requireAuth(req);
  if (authFail) return authFail;

  const ctxOrErr = readCtx({ requireOpenAI: true });
  if (ctxOrErr instanceof Response) return ctxOrErr;
  const ctx = ctxOrErr;

  try {
    const body = await req.json() as Record<string, unknown>;
    const result = await handleGenerateTopics(body, ctx);
    return json(result);
  } catch (err) {
    console.error("[content-creator-topics]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

async function handleGenerateTopics(body: Record<string, unknown>, ctx: Ctx) {
  const vault_category = (body.vault_category as string | undefined)?.trim();
  const count          = Math.min(Math.max((body.count as number | undefined) ?? 5, 1), 10);
  const seed           = (body.seed as string | undefined)?.trim() || undefined;

  if (!vault_category) {
    throw new Error("vault_category is required (use 'all' for cross-category).");
  }

  // 1. Pull vault context. When there's no seed, `allow_broad_sample` gives
  //    us a diverse sample of the category instead of an empty embedding query.
  const vault = await fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
    vault_category: vault_category === "all" ? undefined : vault_category,
    topic:          seed,
    limit:          25,
    allow_broad_sample: !seed,
  });

  if (vault.length === 0) {
    throw new Error(`Vault is empty for category '${vault_category}' — upload some documents first.`);
  }

  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Map retrieved chunks back to their document IDs. Used below to
  //    discard any doc IDs the model hallucinates.
  const chunkIds = vault.map((v) => v.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const { data: chunkRows } = await sb
    .from("vault_chunks")
    .select("id, document_id")
    .in("id", chunkIds);

  const validDocIds = new Set<string>(
    (chunkRows ?? []).map((r: { document_id: string }) => r.document_id),
  );

  // 3. Call OpenAI.
  const { system, user } = buildTopicPrompt({
    vault_block:    formatVaultContext(vault),
    vault_category,
    seed,
    count,
  });

  const ai = await callOpenAI({
    apiKey: ctx.openaiKey!,
    system,
    user,
    temperature: 0.75,  // varied but not wild
  });

  const parsed = safeParseJson<{
    topics: Array<{
      title:                string;
      angle:                string;
      rationale?:           string;
      suggested_keywords?:  string[];
      suggested_audience?:  string;
      suggested_tone?:      string;
      source_document_ids?: string[];
    }>;
  }>(ai.content, "openai topics");

  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    throw new Error("openai topics returned empty array");
  }

  // 4. Insert each topic. Trim every field defensively so a misbehaving
  //    model can't bust the DB CHECK constraints.
  const now = new Date().toISOString();
  const rows = parsed.topics.slice(0, count).map((t) => ({
    title:               trim(t.title, 300) || "Untitled topic",
    angle:               trim(t.angle, 2000) || "(no angle)",
    rationale:           t.rationale ? trim(t.rationale, 2000) : null,
    suggested_keywords:  dedupStrings(t.suggested_keywords ?? []).slice(0, 20),
    suggested_audience:  t.suggested_audience ? trim(t.suggested_audience, 200) : null,
    suggested_tone:      t.suggested_tone     ? trim(t.suggested_tone,     200) : null,
    source_document_ids: dedupUuids(t.source_document_ids ?? []).filter((id) => validDocIds.has(id)),
    vault_category:      vault_category === "all" ? null : vault_category,
    status:              "draft" as const,
    ai_metadata: {
      openai_model: ai.model,
      tokens:       ai.tokens,
      provider:     "openai" as const,
      generated_at: now,
      seed:         seed ?? null,
    },
  }));

  const { data, error } = await sb.from("content_topics").insert(rows).select();
  if (error) throw new Error(`insert topics failed: ${error.message}`);

  return { topics: data };
}
