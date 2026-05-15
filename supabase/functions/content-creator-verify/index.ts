/* ═══════════════════════════════════════════════════════════════════════════
 * Edge Function: content-creator-verify — Stage 3
 *
 * Cross-checks every factual claim in a draft against the Vault and writes
 * a verdict back to the row:
 *   - status → 'verified' if all claims are supported, else 'rejected'
 *   - verification JSON → { status, confidence, notes,
 *       supported_claims[], flagged_claims[], hallucinated_vault_ids }
 *
 * Anthropic-only: verification is a consistency task, not a creative one,
 * so we keep temperature very low and use a single model.
 *
 * Like `content-creator-generate`, this handler resets the row to its
 * previous editable state ('draft' or 'rejected') if the AI call fails,
 * so the admin can retry without manual SQL.
 *
 * POST body: { draft_id: string }
 * Response:  { draft: ContentDraft, verification: VerificationResult }
 *
 * ENV: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · ANTHROPIC_API_KEY
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchVaultContext, formatVaultContext, type VaultEntry,
} from "../_shared/content-creator/vault.ts";
import { buildVerifyPrompt } from "../_shared/content-creator/prompts.ts";
import { callAnthropic } from "../_shared/content-creator/anthropic.ts";
import { fetchAreaBySlug, formatAreaContext } from "../_shared/content-creator/area.ts";
import {
  corsHeaders, json, readCtx, requireAuth, safeParseJson, clearLastError,
  type Ctx,
} from "../_shared/content-creator/common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authFail = requireAuth(req);
  if (authFail) return authFail;

  const ctxOrErr = readCtx({ requireAnthropic: true });
  if (ctxOrErr instanceof Response) return ctxOrErr;
  const ctx = ctxOrErr;

  try {
    const body = await req.json() as Record<string, unknown>;
    const result = await handleVerify(body, ctx);
    return json(result);
  } catch (err) {
    console.error("[content-creator-verify]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

async function handleVerify(body: Record<string, unknown>, ctx: Ctx) {
  const draft_id = body.draft_id as string;
  if (!draft_id) throw new Error("draft_id is required.");

  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: draft, error: loadErr } = await sb
    .from("content_drafts").select("*").eq("id", draft_id).single();
  if (loadErr || !draft) throw new Error(`load draft failed: ${loadErr?.message ?? "not found"}`);
  if (draft.status !== "draft" && draft.status !== "rejected") {
    throw new Error(`draft must be in status 'draft' or 'rejected' (got '${draft.status}')`);
  }

  await sb.from("content_drafts").update({ status: "verifying" }).eq("id", draft_id);

  // Remember the prior editable state so we can roll back on error.
  const priorStatus = draft.status as "draft" | "rejected";
  let vault: VaultEntry[];
  let anthroRes: Awaited<ReturnType<typeof callAnthropic>>;
  let verdict: {
    status: "verified" | "partially_verified" | "unverified";
    confidence: "high" | "medium" | "low";
    notes?: string;
    supported_claims?: { claim: string; vault_id: string; source?: string }[];
    flagged_claims?:   { claim: string; reason: string; suggested_fix?: string }[];
  };

  try {
    // Bigger window for verification — every claim counts. For GEO
    // drafts we also reload the area row so [area:<slug>] citations
    // can be compared against the same local data the writer saw.
    const areaSlug = draft.content_type === "geo"
      ? (draft.brief?.area_slug as string | undefined)
      : undefined;
    const [vaultRes, areaRow] = await Promise.all([
      fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
        keywords:       draft.brief.keywords,
        vault_category: draft.brief.vault_category,
        topic:          draft.brief.topic,
        limit:          40,
      }),
      areaSlug ? fetchAreaBySlug(ctx.sbUrl, ctx.sbKey, areaSlug) : Promise.resolve(null),
    ]);
    vault = vaultRes;
    const areaContext = areaRow ? formatAreaContext(areaRow) : undefined;

    const { system, user } = buildVerifyPrompt({
      content_type: draft.content_type,
      draft:        { title: draft.title, body: draft.body },
      vault_block:  formatVaultContext(vault),
      area_context: areaContext,
    });

    anthroRes = await callAnthropic({
      apiKey: ctx.anthropicKey!,
      system, user,
      temperature: 0.1,   // verification should be boring and consistent
      maxTokens:   3000,
    });

    verdict = safeParseJson(anthroRes.content, "anthropic verify");
  } catch (err) {
    await sb.from("content_drafts").update({
      status: priorStatus,
      ai_metadata: {
        ...(draft.ai_metadata ?? {}),
        last_error: err instanceof Error ? err.message : String(err),
        last_error_at: new Date().toISOString(),
        last_error_stage: "verify",
      },
    }).eq("id", draft_id);
    throw err;
  }

  // Filter hallucinated vault IDs — only keep supported_claims whose
  // vault_id actually existed in the retrieved set.
  const validVaultIds = new Set(vault.map((v) => v.id));
  const filteredSupported = (verdict.supported_claims ?? []).filter(
    (c) => validVaultIds.has(c.vault_id),
  );
  const hallucinated = (verdict.supported_claims ?? []).length - filteredSupported.length;

  const verification = {
    ...verdict,
    supported_claims: filteredSupported,
    flagged_claims:   verdict.flagged_claims ?? [],
    hallucinated_vault_ids: hallucinated,
    checked_at:       new Date().toISOString(),
  };

  // verified only when verdict = "verified" AND no flagged claims remain.
  const finalStatus =
    verdict.status === "verified" && verification.flagged_claims.length === 0
      ? "verified"
      : "rejected";

  const ai_metadata = {
    // Strip stale `last_error_*` from a prior failed verify so the
    // Provenance card matches the current (healthy) verdict.
    ...clearLastError(draft.ai_metadata),
    anthropic_model:     anthroRes.model,
    verified_at:         verification.checked_at,
    verification_tokens: anthroRes.tokens,
  };

  const { data: updated, error: upErr } = await sb
    .from("content_drafts")
    .update({ status: finalStatus, verification, ai_metadata })
    .eq("id", draft_id)
    .select().single();
  if (upErr) throw new Error(`update verify failed: ${upErr.message}`);

  return { draft: updated, verification };
}
