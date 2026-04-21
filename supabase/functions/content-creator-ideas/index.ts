/* ═══════════════════════════════════════════════════════════════════════════
 * Edge Function: content-creator-ideas — Stage 1
 *
 * Takes a brief (topic + tone + audience + keywords + optional vault
 * category + optional source_topic_id) and emits N "idea" rows in
 * content_drafts with status='idea'. Each idea is a short paragraph the
 * admin can read, approve, and hand off to Stage 2.
 *
 * This is deliberately single-model (OpenAI only) — ideation benefits
 * from higher temperature and doesn't need Anthropic's polish pass yet.
 *
 * POST body:
 *   { content_type, platform?, brief: ContentBrief, count? }
 *
 * Response:
 *   { ideas: ContentDraft[] }
 *
 * ENV: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · OPENAI_API_KEY
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchVaultContext, formatVaultContext } from "../_shared/content-creator/vault.ts";
import { buildIdeaPrompt } from "../_shared/content-creator/prompts.ts";
import { callOpenAI } from "../_shared/content-creator/openai.ts";
import { resolveStylePrompt, buildStyleExamplesBlock } from "../_shared/content-creator/styles.ts";
import {
  corsHeaders, json, readCtx, requireAuth, safeParseJson, dedupUuids, type Ctx,
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
    const result = await handleGenerateIdeas(body, ctx);
    return json(result);
  } catch (err) {
    console.error("[content-creator-ideas]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

async function handleGenerateIdeas(body: Record<string, unknown>, ctx: Ctx) {
  const content_type = body.content_type as "social" | "blog" | "newsletter";
  const platform     = body.platform as string | undefined;
  const brief        = body.brief as {
    topic: string; tone?: string; audience?: string; keywords?: string[];
    vault_category?: string; source_topic_id?: string;
  };
  const count = (body.count as number | undefined) ?? 5;

  if (!content_type || !brief?.topic) {
    throw new Error("content_type and brief.topic are required.");
  }

  // 1. Pull vault context + optional writing style in parallel.
  const [vault, style] = await Promise.all([
    fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
      keywords:       brief.keywords,
      vault_category: brief.vault_category,
      topic:          brief.topic,
    }),
    resolveStylePrompt(ctx.sbUrl, ctx.sbKey, (brief as { style_id?: string }).style_id, {
      contentType: content_type,
    }),
  ]);

  // 2. Call OpenAI for N ideas. Temperature bumped for diversity.
  const { system, user } = buildIdeaPrompt({
    content_type, platform, brief,
    vault_block:  formatVaultContext(vault),
    count,
    style_prompt:         style?.prompt,
    style_examples_block: style ? buildStyleExamplesBlock(style.examples) : undefined,
  });

  const ai = await callOpenAI({
    apiKey: ctx.openaiKey!,
    system, user,
    temperature: 0.8,
  });

  const parsed = safeParseJson<{
    ideas: { title: string; summary: string; vault_ids?: string[] }[];
  }>(ai.content, "openai ideas");

  if (!Array.isArray(parsed.ideas) || parsed.ideas.length === 0) {
    throw new Error("openai ideas returned empty array");
  }

  // 3. Insert ideas as content_drafts rows.
  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = parsed.ideas.slice(0, count).map((idea) => ({
    content_type,
    platform: content_type === "social" ? (platform ?? null) : null,
    status:   "idea" as const,
    // Blog/newsletter use the idea title as working title; social MUST be null.
    title:    content_type === "social" ? null : idea.title,
    body:     idea.summary,
    brief,
    ai_metadata: {
      openai_model:  ai.model,
      tokens:        ai.tokens,
      provider:      "openai",
      generated_at:  new Date().toISOString(),
      // Record the writing style used so the admin can later filter /
      // audit drafts by voice. `null` when no style was selected.
      style_id:      style?.id    ?? null,
      style_title:   style?.title ?? null,
    },
    vault_refs: dedupUuids(idea.vault_ids ?? vault.map((v) => v.id)),
  }));

  const { data, error } = await sb.from("content_drafts").insert(rows).select();
  if (error) throw new Error(`insert ideas failed: ${error.message}`);

  return { ideas: data };
}
