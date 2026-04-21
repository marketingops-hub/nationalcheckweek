/* ═══════════════════════════════════════════════════════════════════════════
 * Edge Function: content-creator-generate — Stage 2
 *
 * Promotes an approved_idea row to a full draft. The pipeline is:
 *
 *   1. OpenAI   writes the first draft grounded in vault context.
 *   2. Anthropic improves the draft without introducing new claims.
 *   3. Persist as status='draft' with provenance + drift warnings.
 *
 * Two safety nets:
 *   - On any throw, we reset the row to 'approved_idea' and stash the
 *     error in ai_metadata.last_error so the admin can retry.
 *   - If Anthropic returns un-parseable JSON we fall back to the OpenAI
 *     draft verbatim rather than fail the stage (improvement is a
 *     nice-to-have, the OpenAI draft is already grounded).
 *
 * POST body: { draft_id: string }
 * Response:  { draft: ContentDraft }
 *
 * ENV: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · OPENAI_API_KEY · ANTHROPIC_API_KEY
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchVaultContext, formatVaultContext, type VaultEntry,
} from "../_shared/content-creator/vault.ts";
import {
  buildGeneratePrompt, buildImprovePrompt,
} from "../_shared/content-creator/prompts.ts";
import { callOpenAI } from "../_shared/content-creator/openai.ts";
import { callAnthropic } from "../_shared/content-creator/anthropic.ts";
import { resolveStylePrompt } from "../_shared/content-creator/styles.ts";
import {
  corsHeaders, json, readCtx, requireAuth,
  safeParseJson, dedupUuids, type Ctx,
} from "../_shared/content-creator/common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authFail = requireAuth(req);
  if (authFail) return authFail;

  const ctxOrErr = readCtx({ requireOpenAI: true, requireAnthropic: true });
  if (ctxOrErr instanceof Response) return ctxOrErr;
  const ctx = ctxOrErr;

  try {
    const body = await req.json() as Record<string, unknown>;
    const result = await handleGenerate(body, ctx);
    return json(result);
  } catch (err) {
    console.error("[content-creator-generate]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

async function handleGenerate(body: Record<string, unknown>, ctx: Ctx) {
  const draft_id = body.draft_id as string;
  if (!draft_id) throw new Error("draft_id is required.");

  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Load.
  const { data: draft, error: loadErr } = await sb
    .from("content_drafts").select("*").eq("id", draft_id).single();
  if (loadErr || !draft) throw new Error(`load draft failed: ${loadErr?.message ?? "not found"}`);
  if (draft.status !== "approved_idea") {
    throw new Error(`draft must be in status 'approved_idea' (got '${draft.status}')`);
  }

  // 2. Flip to 'generating' so the UI can show a spinner.
  await sb.from("content_drafts").update({ status: "generating" }).eq("id", draft_id);

  // 3-5. AI chain with try/catch that resets on failure.
  let openaiRes: Awaited<ReturnType<typeof callOpenAI>>;
  let anthroRes: Awaited<ReturnType<typeof callAnthropic>>;
  let openaiDraft: { title: string | null; body: string; vault_ids_used?: string[] };
  let improved:    { title: string | null; body: string; drift_warnings?: string[] };
  let vault: VaultEntry[];
  let vaultBlock: string;

  try {
    // Fetch vault + style concurrently — both are independent DB reads.
    const [vaultRes, style] = await Promise.all([
      fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
        keywords:       draft.brief.keywords,
        vault_category: draft.brief.vault_category,
        topic:          draft.brief.topic,
      }),
      resolveStylePrompt(ctx.sbUrl, ctx.sbKey, draft.brief?.style_id),
    ]);
    vault      = vaultRes;
    vaultBlock = formatVaultContext(vault);

    // Stash the resolved style on the draft's ai_metadata for audit. We do
    // this on the "generate" pass (not ideas) because that's when a human
    // committed to the voice — ideas may have been generated style-less.
    if (style) {
      await sb.from("content_drafts").update({
        ai_metadata: {
          ...(draft.ai_metadata ?? {}),
          style_id:    style.id,
          style_title: style.title,
        },
      }).eq("id", draft_id);
    }

    // OpenAI draft.
    const gen = buildGeneratePrompt({
      content_type: draft.content_type,
      platform:     draft.platform ?? undefined,
      idea:         { title: draft.title ?? "(untitled idea)", summary: draft.body },
      brief:        draft.brief,
      vault_block:  vaultBlock,
      style_prompt: style?.prompt,
    });

    openaiRes = await callOpenAI({
      apiKey: ctx.openaiKey!,
      system: gen.system, user: gen.user,
      temperature: 0.5, maxTokens: 3500,
    });
    openaiDraft = safeParseJson(openaiRes.content, "openai draft");

    // Anthropic improvement pass.
    const imp = buildImprovePrompt({
      content_type: draft.content_type,
      platform:     draft.platform ?? undefined,
      draft:        { title: openaiDraft.title, body: openaiDraft.body },
      vault_block:  vaultBlock,
    });

    anthroRes = await callAnthropic({
      apiKey: ctx.anthropicKey!,
      system: imp.system, user: imp.user,
      temperature: 0.3, maxTokens: 3500,
    });

    // Graceful degradation: if Claude returns unparseable JSON we keep the
    // OpenAI draft and surface a drift warning rather than fail the stage.
    try {
      improved = safeParseJson(anthroRes.content, "anthropic improve");
    } catch (parseErr) {
      console.warn("[content-creator-generate] improve parse failed, keeping OpenAI draft:",
        parseErr instanceof Error ? parseErr.message : parseErr);
      improved = {
        title:          openaiDraft.title,
        body:           openaiDraft.body,
        drift_warnings: [
          `Anthropic improve pass skipped: invalid JSON from model (${
            parseErr instanceof Error ? parseErr.message.slice(0, 120) : "parse error"
          }).`,
        ],
      };
    }
  } catch (err) {
    // Reset on failure so the admin can retry.
    await sb.from("content_drafts").update({
      status: "approved_idea",
      ai_metadata: {
        ...(draft.ai_metadata ?? {}),
        last_error: err instanceof Error ? err.message : String(err),
        last_error_at: new Date().toISOString(),
        last_error_stage: "generate",
      },
    }).eq("id", draft_id);
    throw err;
  }

  // 6. Persist.
  const newTitle = draft.content_type === "social" ? null : (improved.title ?? openaiDraft.title);
  const newBody  = improved.body;

  const ai_metadata = {
    ...(draft.ai_metadata ?? {}),
    openai_model:    openaiRes.model,
    anthropic_model: anthroRes.model,
    tokens: {
      prompt:     (openaiRes.tokens.prompt     + anthroRes.tokens.prompt),
      completion: (openaiRes.tokens.completion + anthroRes.tokens.completion),
      total:      (openaiRes.tokens.total      + anthroRes.tokens.total),
    },
    drift_warnings: improved.drift_warnings ?? [],
    generated_at:   new Date().toISOString(),
  };

  const { data: updated, error: upErr } = await sb
    .from("content_drafts")
    .update({
      status:     "draft",
      title:      newTitle,
      body:       newBody,
      ai_metadata,
      vault_refs: dedupUuids([
        ...(draft.vault_refs ?? []),
        ...(openaiDraft.vault_ids_used ?? []),
        ...vault.map((v) => v.id),
      ]),
    })
    .eq("id", draft_id)
    .select().single();
  if (upErr) throw new Error(`update draft failed: ${upErr.message}`);

  return { draft: updated };
}
