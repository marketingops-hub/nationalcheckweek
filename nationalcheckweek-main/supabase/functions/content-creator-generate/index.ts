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
import { resolveStylePrompt, buildStyleExamplesBlock } from "../_shared/content-creator/styles.ts";
import { fetchAreaBySlug, formatAreaContext } from "../_shared/content-creator/area.ts";
import { formatCitations } from "../_shared/content-creator/citations.ts";
import {
  countWords, wordTarget, isOutsideTarget, buildLengthRetryDirective,
} from "../_shared/content-creator/length.ts";
import { evaluateDensity } from "../_shared/content-creator/density.ts";
import { sumCosts } from "../_shared/content-creator/pricing.ts";
import {
  corsHeaders, json, readCtx, requireAuth,
  safeParseJson, dedupUuids, createLogger, clearLastError,
  type Ctx, type Logger,
} from "../_shared/content-creator/common.ts";

/* Hard character budgets per social platform — mirrors the values in
 * prompts.ts' PLATFORM table. Duplicated here rather than exported because
 * keeping the table local to prompts.ts keeps the prompt concerns isolated,
 * and this is a five-line map that almost never changes. */
const SOCIAL_MAX_CHARS: Record<string, number> = {
  twitter:   280,
  linkedin:  3000,
  facebook:  2000,
  instagram: 2200,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authFail = requireAuth(req);
  if (authFail) return authFail;

  const ctxOrErr = readCtx({ requireOpenAI: true, requireAnthropic: true });
  if (ctxOrErr instanceof Response) return ctxOrErr;
  const ctx = ctxOrErr;

  // Request-scoped logger: every line below is prefixed with the same
  // req= id so Supabase log search can filter a single admin click
  // across vault fetch + OpenAI + Anthropic + post-process.
  const log = createLogger("content-creator-generate");
  const topSpan = log.span("handleGenerate");

  try {
    const body = await req.json() as Record<string, unknown>;
    const result = await handleGenerate(body, ctx, log);
    topSpan.end();
    // request_id echoed on the success response so the admin UI can
    // surface it next to any drift warning the generate step produced.
    return json({ ...result, request_id: log.requestId });
  } catch (err) {
    topSpan.end();
    log.error("failed:", err);
    return json({
      error: err instanceof Error ? err.message : String(err),
      request_id: log.requestId,
    }, 500);
  }
});

async function handleGenerate(body: Record<string, unknown>, ctx: Ctx, log: Logger) {
  const draft_id = body.draft_id as string;
  if (!draft_id) throw new Error("draft_id is required.");
  log.info(`draft_id=${draft_id}`);

  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // `regeneration: true` comes from the Request-improvement flow. When
  // present, we accept a broader set of source statuses (draft, verified,
  // rejected) — the Next.js route already enforced the transition rule,
  // we just need to not reject those here. On failure below, we reset to
  // the *original* status instead of 'approved_idea'.
  const isRegeneration = body.regeneration === true;

  // 1. Load.
  const { data: draft, error: loadErr } = await sb
    .from("content_drafts").select("*").eq("id", draft_id).single();
  if (loadErr || !draft) throw new Error(`load draft failed: ${loadErr?.message ?? "not found"}`);

  const validFromStatuses = isRegeneration
    ? ["approved_idea", "draft", "verified", "rejected"]
    : ["approved_idea"];
  if (!validFromStatuses.includes(draft.status)) {
    throw new Error(
      `draft must be in status ${validFromStatuses.map((s) => `'${s}'`).join(" or ")} (got '${draft.status}')`,
    );
  }
  const originalStatus = draft.status;

  // 2. Flip to 'generating' so the UI can show a spinner.
  await sb.from("content_drafts").update({ status: "generating" }).eq("id", draft_id);

  // 3-5. AI chain with try/catch that resets on failure.
  let openaiRes: Awaited<ReturnType<typeof callOpenAI>>;
  let anthroRes: Awaited<ReturnType<typeof callAnthropic>>;
  let openaiDraft: { title: string | null; body: string; vault_ids_used?: string[] };
  let improved:    { title: string | null; body: string; drift_warnings?: string[] };
  let vault: VaultEntry[];
  let vaultBlock: string;

  // Per-stage latency counters. Populated as we go so the final update
  // can stash them on ai_metadata for the detail page's Provenance card.
  let msVault     = 0;
  let msOpenai    = 0;
  let msAnthropic = 0;
  // Tokens accumulated across the (up to 2) OpenAI draft passes when the
  // length gate kicks in. Anthropic only runs once per request.
  const openaiTokenAcc = { prompt: 0, completion: 0, total: 0 };
  // Word-count retry telemetry — we need these for the Provenance card
  // and for debugging prompt drift on long-form.
  let lengthRetry: { first_count: number; final_count: number; direction: 'short' | 'long' | 'ok' } | null = null;

  log.info(
    `status=${draft.status}→generating type=${draft.content_type}`,
    isRegeneration ? "regen" : "first-pass",
  );

  try {
    // Fetch vault + style (+ area, GEO only) concurrently — independent
    // DB reads. The area fetch resolves to null when the draft isn't GEO
    // or the slug is bad; the call cost is trivial and the conditional
    // adds zero time to non-GEO pipelines.
    const vaultSpan = log.span("vault+style+area");
    const areaSlug = draft.content_type === "geo"
      ? (draft.brief?.area_slug as string | undefined)
      : undefined;
    const [vaultRes, style, area] = await Promise.all([
      fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
        keywords:       draft.brief.keywords,
        vault_category: draft.brief.vault_category,
        topic:          draft.brief.topic,
      }),
      resolveStylePrompt(ctx.sbUrl, ctx.sbKey, draft.brief?.style_id, {
        contentType: draft.content_type,
      }),
      areaSlug
        ? fetchAreaBySlug(ctx.sbUrl, ctx.sbKey, areaSlug)
        : Promise.resolve(null),
    ]);
    msVault    = vaultSpan.end();
    vault      = vaultRes;
    vaultBlock = formatVaultContext(vault);

    // GEO-only: render the area block. Falls back to undefined when no
    // area row resolved — prompts.ts handles the omission gracefully.
    const areaContext = area ? formatAreaContext(area) : undefined;
    if (draft.content_type === "geo" && !areaContext) {
      log.warn(`geo draft missing area row (slug=${areaSlug ?? "(none)"}) — generating without local context`);
    }

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

    // OpenAI draft. If the admin asked for an improvement, inject their
    // feedback + (when we have one) the previous draft body so the model
    // knows exactly what to fix. The prompts module reads both fields
    // out of `brief` / options and appends them to the user prompt.
    const gen = buildGeneratePrompt({
      content_type: draft.content_type,
      platform:     draft.platform ?? undefined,
      idea:         { title: draft.title ?? "(untitled idea)", summary: draft.body },
      brief:        draft.brief,
      vault_block:  vaultBlock,
      style_prompt:         style?.prompt,
      style_examples_block: style ? buildStyleExamplesBlock(style.examples) : undefined,
      regeneration_feedback: isRegeneration
        ? (draft.brief?.regeneration_feedback as string | undefined)
        : undefined,
      previous_draft: isRegeneration && originalStatus !== "approved_idea"
        ? { title: draft.title ?? null, body: draft.body ?? "" }
        : undefined,
      // A title toggle only makes sense for long-form. Social never has one.
      include_title: draft.content_type === "social"
        ? false
        : (draft.brief?.include_title ?? true),
      // Admin-picked length on the "Generate options" modal. Undefined →
      // prompts.ts emits the default range for the content type.
      length_preset: draft.brief?.length_preset,
      // GEO-only: local context + slug so the model knows to cite local
      // claims as [area:<slug>]. Both undefined on non-GEO drafts and
      // prompts.ts silently omits the corresponding blocks.
      area_context:  areaContext,
      area_slug:     areaSlug,
    });

    const openaiSpan = log.span("openai.first");
    openaiRes = await callOpenAI({
      apiKey: ctx.openaiKey!,
      system: gen.system, user: gen.user,
      temperature: 0.5, maxTokens: 3500,
    });
    msOpenai += openaiSpan.end();
    openaiTokenAcc.prompt     += openaiRes.tokens.prompt;
    openaiTokenAcc.completion += openaiRes.tokens.completion;
    openaiTokenAcc.total      += openaiRes.tokens.total;
    openaiDraft = safeParseJson(openaiRes.content, "openai draft");

    /* ─── Length gate (long-form only) ────────────────────────── */
    // Blog + newsletter have explicit word-count ranges in the prompt,
    // but the model routinely misses by ±30%. Rather than ship a
    // wrong-length draft and expect the admin to eyeball + regenerate,
    // we check the count once and retry *once* with a concrete directive.
    // Cap the retry at 1 so the worst case is 2 OpenAI calls, not a loop.
    // Length preset (undefined → 'standard') scales the range the prompt
    // asked for. Keeps admin's "Generate options" choice honoured here too.
    const target = wordTarget(draft.content_type, draft.brief?.length_preset);
    if (target) {
      const firstCount = countWords(openaiDraft.body ?? "");
      const gate = isOutsideTarget(firstCount, target);
      if (gate.outside) {
        const directive = buildLengthRetryDirective(firstCount, target, gate.direction as 'short' | 'long');
        const retryUser = `${gen.user}\n\nLENGTH CORRECTION\n${directive}`;

        log.info(
          `length gate: ${firstCount} ${gate.direction} target ${target.min}-${target.max}, retrying`,
        );
        const retrySpan = log.span("openai.lengthRetry");
        const retryRes = await callOpenAI({
          apiKey: ctx.openaiKey!,
          system: gen.system, user: retryUser,
          temperature: 0.5, maxTokens: 3500,
        });
        msOpenai += retrySpan.end();
        openaiTokenAcc.prompt     += retryRes.tokens.prompt;
        openaiTokenAcc.completion += retryRes.tokens.completion;
        openaiTokenAcc.total      += retryRes.tokens.total;

        try {
          const retryDraft = safeParseJson<typeof openaiDraft>(retryRes.content, "openai retry");
          openaiDraft = retryDraft;
          // Keep the latest model id from the retry leg for provenance.
          openaiRes = retryRes;
          lengthRetry = {
            first_count: firstCount,
            final_count: countWords(retryDraft.body ?? ""),
            direction:   gate.direction,
          };
        } catch (parseErr) {
          // Bad JSON on retry — keep the original draft but note it.
          log.warn("length retry parse failed, keeping first draft:",
            parseErr instanceof Error ? parseErr.message : parseErr);
          lengthRetry = {
            first_count: firstCount,
            final_count: firstCount,
            direction:   gate.direction,
          };
        }
      }
    }

    // Anthropic improvement pass.
    const imp = buildImprovePrompt({
      content_type: draft.content_type,
      platform:     draft.platform ?? undefined,
      draft:        { title: openaiDraft.title, body: openaiDraft.body },
      vault_block:  vaultBlock,
      area_context: areaContext,
    });

    const anthroSpan = log.span("anthropic.improve");
    anthroRes = await callAnthropic({
      apiKey: ctx.anthropicKey!,
      system: imp.system, user: imp.user,
      temperature: 0.3, maxTokens: 3500,
    });
    msAnthropic = anthroSpan.end();

    // Graceful degradation: if Claude returns unparseable JSON we keep the
    // OpenAI draft and surface a drift warning rather than fail the stage.
    try {
      improved = safeParseJson(anthroRes.content, "anthropic improve");
    } catch (parseErr) {
      log.warn("improve parse failed, keeping OpenAI draft:",
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
    // Reset on failure so the admin can retry. For regenerations we roll
    // back to whatever the row was before — the admin's content is
    // preserved either way because the 'generating' flip doesn't clobber
    // body/title until the final update at the end of this function.
    await sb.from("content_drafts").update({
      status: originalStatus,
      ai_metadata: {
        ...(draft.ai_metadata ?? {}),
        last_error: err instanceof Error ? err.message : String(err),
        last_error_at: new Date().toISOString(),
        last_error_stage: "generate",
        // Persist the request_id on failure so the admin can paste it
        // straight into Supabase log search to find the upstream cause.
        last_error_request_id: log.requestId,
      },
    }).eq("id", draft_id);
    throw err;
  }

  // 6. Post-process: replace [vault:<uuid>] markers with reader-friendly
  //    [Source N] refs + append a Sources block for long-form. This runs
  //    once, right before persisting, so the verifier stage always sees
  //    the final shape the reader will see.
  const cited = formatCitations(improved.body, vault, draft.content_type);

  // Respect the include_title toggle on long-form. When false, force the
  // title to null even if the model returned one.
  const includeTitle = draft.content_type === "social"
    ? false
    : (draft.brief?.include_title ?? true);
  const newTitle = !includeTitle
    ? null
    : (draft.content_type === "social" ? null : (improved.title ?? openaiDraft.title));
  const newBody  = cited.body;

  // Char-limit enforcement for social posts. We don't truncate (that would
  // silently mangle the content); we surface a drift warning so the admin
  // sees it on the detail page and can edit down before publishing.
  const drift = [...(improved.drift_warnings ?? [])];
  const platformLimit = SOCIAL_MAX_CHARS[draft.platform ?? ""];
  if (platformLimit && newBody.length > platformLimit) {
    drift.push(
      `Body is ${newBody.length} chars — over the ${draft.platform} limit of ${platformLimit}. Trim before publishing.`,
    );
  }

  // Cost estimate for the two AI legs. Embeddings are counted in the
  // vault fetcher's own telemetry (not here) because they happen outside
  // this try/catch. `partial: true` means we hit an unknown model and
  // the total is under-reported; the UI renders "~" to signal that.
  const cost = sumCosts([
    { model: openaiRes.model, tokens: openaiTokenAcc },
    { model: anthroRes.model, tokens: anthroRes.tokens },
  ]);

  const finalWordCount = draft.content_type === 'social'
    ? null
    : countWords(newBody);

  // Evidence-density post-check. We score against the *distinct vault ids*
  // the citation post-processor already extracted, not the raw [vault:...]
  // count, so a writer that cites the same source three times only gets
  // credit once (matches the prompt rule the model was given).
  // Social posts get a simple "≥1 cite" check here rather than words-per-cite.
  const distinctCites = cited.ordered_vault_ids.length;
  const densityReport = evaluateDensity(
    draft.content_type,
    draft.content_type === 'social' ? newBody.length : (finalWordCount ?? 0),
    distinctCites,
  );
  if (draft.content_type === 'social' && distinctCites === 0) {
    drift.push('No vault citations in this social post. Add at least one to keep the claim auditable.');
  } else if (densityReport.belowTarget && densityReport.warning) {
    drift.push(densityReport.warning);
  }

  const ai_metadata = {
    // Strip any `last_error_*` from a prior failed run so the Provenance
    // card doesn't keep showing stale errors on a now-healthy draft.
    ...clearLastError(draft.ai_metadata),
    openai_model:    openaiRes.model,
    anthropic_model: anthroRes.model,
    tokens: {
      prompt:     openaiTokenAcc.prompt     + anthroRes.tokens.prompt,
      completion: openaiTokenAcc.completion + anthroRes.tokens.completion,
      total:      openaiTokenAcc.total      + anthroRes.tokens.total,
    },
    drift_warnings:        drift,
    generated_at:          new Date().toISOString(),
    // Record citation shape so the detail UI can render Sources links and
    // the verifier can map [Source N] back to vault ids if needed.
    citation_style:        cited.citation_style,
    ordered_vault_ids:     cited.ordered_vault_ids,
    char_count:            newBody.length,
    char_limit:            platformLimit ?? null,
    char_limit_exceeded:   platformLimit ? newBody.length > platformLimit : false,
    word_count:            finalWordCount,
    length_retry:          lengthRetry,
    evidence: {
      cites:              distinctCites,
      words_per_cite:     Number.isFinite(densityReport.wordsPerCite)
                            ? Math.round(densityReport.wordsPerCite)
                            : null,
      below_target:       densityReport.belowTarget,
    },
    latency_ms: {
      vault:     msVault,
      openai:    msOpenai,
      anthropic: msAnthropic,
      total:     msVault + msOpenai + msAnthropic,
    },
    cost_usd:          cost.total,
    cost_partial:      cost.partial,
    // Request id from createLogger — matches the `req=` prefix on every
    // log line for this invocation. Stored so the detail-page Provenance
    // card can let admins jump to the matching Supabase log filter.
    request_id:        log.requestId,
  };

  // Clear one-shot fields after a successful run: regeneration_feedback
  // must not leak into the next generation, and a stale verification
  // verdict on a regen would mislead the admin.
  const nextBrief = isRegeneration
    ? { ...(draft.brief ?? {}), regeneration_feedback: undefined }
    : draft.brief;

  const { data: updated, error: upErr } = await sb
    .from("content_drafts")
    .update({
      status:     "draft",
      title:      newTitle,
      body:       newBody,
      brief:      nextBrief,
      verification: {},
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
