/* ═══════════════════════════════════════════════════════════════════════════
 * Supabase Edge Function: content-creator
 *
 * Routes by `stage`:
 *   • generate_ideas  — vault → OpenAI → N idea rows inserted as status='idea'
 *   • generate        — idea row → OpenAI draft → Anthropic improve → draft row
 *   • verify          — draft body → Anthropic vault cross-check → verdict
 *
 * Deploy: supabase functions deploy content-creator
 *
 * ENV required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 *   ANTHROPIC_API_KEY
 * ═══════════════════════════════════════════════════════════════════════════ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchVaultContext, formatVaultContext, type VaultEntry } from "./vault.ts";
// (VaultEntry is re-exported so the generate try/catch can hoist its declared type.)
import {
  buildTopicPrompt,
  buildIdeaPrompt,
  buildGeneratePrompt,
  buildImprovePrompt,
  buildVerifyPrompt,
} from "./prompts.ts";
import { callOpenAI } from "./openai.ts";
import { callAnthropic } from "./anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth — Next.js proxies with the service-role key ───────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header." }, 401);

    const body = (await req.json()) as { stage: string; [k: string]: unknown };
    const stage = body.stage;

    const sbUrl = Deno.env.get("SUPABASE_URL")!;
    const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey    = Deno.env.get("OPENAI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!openaiKey || !anthropicKey) {
      return json({ error: "OPENAI_API_KEY and ANTHROPIC_API_KEY are both required." }, 500);
    }

    switch (stage) {
      case "generate_topics":
        return json(await handleGenerateTopics(body, { sbUrl, sbKey, openaiKey, anthropicKey }));
      case "generate_ideas":
        return json(await handleGenerateIdeas(body, { sbUrl, sbKey, openaiKey, anthropicKey }));
      case "generate":
        return json(await handleGenerate(body, { sbUrl, sbKey, openaiKey, anthropicKey }));
      case "verify":
        return json(await handleVerify(body, { sbUrl, sbKey, anthropicKey }));
      default:
        return json({ error: `Unknown stage: ${stage}` }, 400);
    }
  } catch (err) {
    console.error("[content-creator] unhandled error", err);
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});

/* ─── Stage 0: topic generation ──────────────────────────────────────────── */

/**
 * Generate N content topics from the Vault.
 *
 * Input shape (from the API route):
 *   { stage: 'generate_topics', vault_category: string, count?: number, seed?: string }
 *
 * Contract:
 *   • Topics land in content_topics with status='draft' (review-before-approve).
 *   • source_document_ids are filtered against the actual retrieved chunks so
 *     Claude/GPT hallucinated IDs don't get persisted.
 *   • Returns the inserted rows so the UI can render immediately.
 */
async function handleGenerateTopics(body: Record<string, unknown>, ctx: Ctx) {
  const vault_category = (body.vault_category as string | undefined)?.trim();
  const count          = Math.min(Math.max((body.count as number | undefined) ?? 5, 1), 10);
  const seed           = (body.seed as string | undefined)?.trim() || undefined;

  if (!vault_category) throw new Error("vault_category is required (use 'all' for cross-category).");

  // 1. Pull vault context. If no seed, use the broad-sample path so we still
  //    have material to feed into the prompt.
  const vault = await fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
    vault_category: vault_category === "all" ? undefined : vault_category,
    topic:          seed,
    limit:          25,          // generous window — more context = better angles
    allow_broad_sample: !seed,   // only sample broadly when the admin gave nothing
  });

  if (vault.length === 0) {
    throw new Error(
      `Vault is empty for category '${vault_category}' — upload some documents first.`,
    );
  }

  // 2. Build the set of document IDs that the retrieved chunks actually came
  //    from. The prompt asks the model to cite these; we'll use this set to
  //    filter hallucinated IDs out of the response.
  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Map chunk_id → document_id via vault_chunks so we don't trust the model
  // to invent the relationship. We need this because vault returns chunk IDs
  // in `.id`, not document IDs.
  const chunkIds = vault.map((v) => v.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const { data: chunkRows } = await sb
    .from("vault_chunks")
    .select("id, document_id")
    .in("id", chunkIds);

  const validDocIds = new Set<string>(
    (chunkRows ?? []).map((r: { document_id: string }) => r.document_id),
  );

  // 3. Call OpenAI for N topics.
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
    temperature: 0.75,  // topics should be varied but not wild
  });

  const parsed = safeParseJson<{
    topics: Array<{
      title:               string;
      angle:               string;
      rationale?:          string;
      suggested_keywords?: string[];
      suggested_audience?: string;
      suggested_tone?:     string;
      source_document_ids?: string[];
    }>;
  }>(ai.content, "openai topics");

  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    throw new Error("openai topics returned empty array");
  }

  // 4. Insert each topic as a draft row. Trim lengths defensively so a
  //    misbehaving model can't bust the DB CHECK constraints.
  const now = new Date().toISOString();
  const rows = parsed.topics.slice(0, count).map((t) => ({
    title:               trim(t.title, 300) || "Untitled topic",
    angle:               trim(t.angle, 2000) || "(no angle)",
    rationale:           t.rationale ? trim(t.rationale, 2000) : null,
    suggested_keywords:  dedupStrings(t.suggested_keywords ?? []).slice(0, 20),
    suggested_audience:  t.suggested_audience ? trim(t.suggested_audience, 200) : null,
    suggested_tone:      t.suggested_tone     ? trim(t.suggested_tone,     200) : null,
    // Filter to only documents we actually retrieved chunks from.
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

function trim(s: string, max: number): string {
  return (s ?? "").toString().trim().slice(0, max);
}

function dedupStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    const t = (v ?? "").toString().trim();
    if (t.length > 0 && t.length <= 80 && !seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out;
}

/* ─── Stage 1: idea generation ───────────────────────────────────────────── */

interface Ctx {
  sbUrl: string;
  sbKey: string;
  openaiKey?: string;
  anthropicKey?: string;
}

async function handleGenerateIdeas(body: Record<string, unknown>, ctx: Ctx) {
  const content_type = body.content_type as "social" | "blog" | "newsletter";
  const platform     = body.platform as string | undefined;
  const brief        = body.brief as { topic: string; tone?: string; audience?: string; keywords?: string[]; vault_category?: string };
  const count        = (body.count as number | undefined) ?? 5;

  if (!content_type || !brief?.topic) {
    throw new Error("content_type and brief.topic are required.");
  }

  // 1. Pull vault context.
  const vault = await fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
    keywords:       brief.keywords,
    vault_category: brief.vault_category,
    topic:          brief.topic,
  });

  // 2. Call OpenAI for N ideas.
  const { system, user } = buildIdeaPrompt({
    content_type,
    platform,
    brief,
    vault_block: formatVaultContext(vault),
    count,
  });

  const ai = await callOpenAI({
    apiKey: ctx.openaiKey!,
    system,
    user,
    temperature: 0.8,  // ideas should be diverse
  });

  const parsed = safeParseJson<{
    ideas: { title: string; summary: string; vault_ids?: string[] }[];
  }>(ai.content, "openai ideas");
  if (!Array.isArray(parsed.ideas) || parsed.ideas.length === 0) {
    throw new Error("openai ideas returned empty array");
  }

  // 3. Insert each idea as a draft row with status='idea'.
  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = parsed.ideas.slice(0, count).map((idea) => ({
    content_type,
    platform: content_type === "social" ? (platform ?? null) : null,
    status:   "idea" as const,
    // Blog/newsletter use the idea title as the working title; social must be null.
    title:    content_type === "social" ? null : idea.title,
    body:     idea.summary,
    brief,
    ai_metadata: {
      openai_model:  ai.model,
      tokens:        ai.tokens,
      provider:      "openai",
      generated_at:  new Date().toISOString(),
    },
    vault_refs: dedupUuids(idea.vault_ids ?? vault.map((v) => v.id)),
  }));

  const { data, error } = await sb.from("content_drafts").insert(rows).select();
  if (error) throw new Error(`insert ideas failed: ${error.message}`);

  return { ideas: data };
}

/* ─── Stage 2: content generation (OpenAI → Anthropic improve) ───────────── */

async function handleGenerate(body: Record<string, unknown>, ctx: Ctx) {
  const draft_id = body.draft_id as string;
  if (!draft_id) throw new Error("draft_id is required.");

  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Load the approved idea.
  const { data: draft, error: loadErr } = await sb
    .from("content_drafts")
    .select("*")
    .eq("id", draft_id)
    .single();
  if (loadErr || !draft) throw new Error(`load draft failed: ${loadErr?.message ?? "not found"}`);
  if (draft.status !== "approved_idea") {
    throw new Error(`draft must be in status 'approved_idea' (got '${draft.status}')`);
  }

  // 2. Flip to 'generating' so the UI can show a spinner.
  await sb.from("content_drafts").update({ status: "generating" }).eq("id", draft_id);

  // 3-5. Run the AI chain inside a try/catch so a crash anywhere resets the
  //      draft back to 'approved_idea' rather than leaving it stuck in
  //      'generating' forever.
  let openaiRes: Awaited<ReturnType<typeof callOpenAI>>;
  let anthroRes: Awaited<ReturnType<typeof callAnthropic>>;
  let openaiDraft: { title: string | null; body: string; vault_ids_used?: string[] };
  let improved:    { title: string | null; body: string; drift_warnings?: string[] };
  let vault: VaultEntry[];
  let vaultBlock: string;

  try {
    // Re-pull vault context (brief may reference different keywords than the idea).
    vault = await fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
      keywords:       draft.brief.keywords,
      vault_category: draft.brief.vault_category,
      topic:          draft.brief.topic,
    });
    vaultBlock = formatVaultContext(vault);

    // OpenAI draft.
    const gen = buildGeneratePrompt({
      content_type: draft.content_type,
      platform:     draft.platform ?? undefined,
      idea:         { title: draft.title ?? "(untitled idea)", summary: draft.body },
      brief:        draft.brief,
      vault_block:  vaultBlock,
    });

    openaiRes = await callOpenAI({
      apiKey: ctx.openaiKey!,
      system: gen.system,
      user:   gen.user,
      temperature: 0.5,
      maxTokens:   3500,
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
      system: imp.system,
      user:   imp.user,
      temperature: 0.3,
      maxTokens:   3500,
    });

    // Graceful degradation: if Claude's improve pass returns unparseable
    // JSON we keep the OpenAI draft verbatim instead of blowing up the
    // whole stage. The improve pass is a nice-to-have polish — the OpenAI
    // draft is already grounded and usable. We record the parse failure in
    // ai_metadata so admins can see which drafts skipped the polish.
    try {
      improved = safeParseJson(anthroRes.content, "anthropic improve");
    } catch (parseErr) {
      console.warn("[content-creator] improve parse failed, keeping OpenAI draft:",
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
    // Reset the row so the admin can retry.
    await sb
      .from("content_drafts")
      .update({
        status: "approved_idea",
        ai_metadata: {
          ...(draft.ai_metadata ?? {}),
          last_error: err instanceof Error ? err.message : String(err),
          last_error_at: new Date().toISOString(),
          last_error_stage: "generate",
        },
      })
      .eq("id", draft_id);
    throw err;
  }

  // 6. Persist.
  const newTitle = draft.content_type === "social" ? null : (improved.title ?? openaiDraft.title);
  const newBody  = improved.body;

  const ai_metadata = {
    ...(draft.ai_metadata ?? {}),
    openai_model:     openaiRes.model,
    anthropic_model:  anthroRes.model,
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
      status:      "draft",
      title:       newTitle,
      body:        newBody,
      ai_metadata,
      vault_refs:  dedupUuids([
        ...(draft.vault_refs ?? []),
        ...(openaiDraft.vault_ids_used ?? []),
        ...vault.map((v) => v.id),
      ]),
    })
    .eq("id", draft_id)
    .select()
    .single();
  if (upErr) throw new Error(`update draft failed: ${upErr.message}`);

  return { draft: updated };
}

/* ─── Stage 3: verification (Anthropic vs vault) ─────────────────────────── */

async function handleVerify(body: Record<string, unknown>, ctx: Ctx) {
  const draft_id = body.draft_id as string;
  if (!draft_id) throw new Error("draft_id is required.");

  const sb = createClient(ctx.sbUrl, ctx.sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: draft, error: loadErr } = await sb
    .from("content_drafts")
    .select("*")
    .eq("id", draft_id)
    .single();
  if (loadErr || !draft) throw new Error(`load draft failed: ${loadErr?.message ?? "not found"}`);
  if (draft.status !== "draft" && draft.status !== "rejected") {
    throw new Error(`draft must be in status 'draft' or 'rejected' (got '${draft.status}')`);
  }

  await sb.from("content_drafts").update({ status: "verifying" }).eq("id", draft_id);

  // Run the AI chain inside a try/catch — on any failure we demote the row
  // back to the prior editable state so the admin can retry without SQL.
  const priorStatus = draft.status;  // 'draft' or 'rejected'
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
    // Pull vault context using the draft's brief — same corpus the writer saw.
    vault = await fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
      keywords:       draft.brief.keywords,
      vault_category: draft.brief.vault_category,
      topic:          draft.brief.topic,
      limit:          40,  // bigger window for verification — every claim counts
    });

    const { system, user } = buildVerifyPrompt({
      content_type: draft.content_type,
      draft:        { title: draft.title, body: draft.body },
      vault_block:  formatVaultContext(vault),
    });

    anthroRes = await callAnthropic({
      apiKey: ctx.anthropicKey!,
      system,
      user,
      temperature: 0.1,   // verification should be boring and consistent
      maxTokens:   3000,
    });

    verdict = safeParseJson(anthroRes.content, "anthropic verify");
  } catch (err) {
    await sb
      .from("content_drafts")
      .update({
        status: priorStatus,
        ai_metadata: {
          ...(draft.ai_metadata ?? {}),
          last_error: err instanceof Error ? err.message : String(err),
          last_error_at: new Date().toISOString(),
          last_error_stage: "verify",
        },
      })
      .eq("id", draft_id);
    throw err;
  }

  // Only keep vault_ids that were actually sent — prevents Claude from
  // hallucinating uuids that aren't in the vault.
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

  // Decide final status.
  //   • verified  → only when verdict = "verified" AND no flagged claims.
  //   • rejected  → anything else.
  const finalStatus =
    verdict.status === "verified" && verification.flagged_claims.length === 0
      ? "verified"
      : "rejected";

  const ai_metadata = {
    ...(draft.ai_metadata ?? {}),
    anthropic_model: anthroRes.model,
    verified_at:     verification.checked_at,
    verification_tokens: anthroRes.tokens,
  };

  const { data: updated, error: upErr } = await sb
    .from("content_drafts")
    .update({ status: finalStatus, verification, ai_metadata })
    .eq("id", draft_id)
    .select()
    .single();
  if (upErr) throw new Error(`update verify failed: ${upErr.message}`);

  return { draft: updated, verification };
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function dedupUuids(arr: string[]): string[] {
  return Array.from(new Set(arr.filter((v) => typeof v === "string" && v.length > 0)));
}

/**
 * Parse a JSON string but wrap errors with a label so the admin can see
 * which stage failed (OpenAI draft vs Anthropic improve vs verify).
 *
 * Claude occasionally emits invalid JSON with un-escaped double quotes inside
 * a long body string (e.g. `"body": "So-called "soft skills" matter"`). We
 * make one repair attempt before giving up.
 */
function safeParseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(repairJson(raw)) as T;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const preview = raw.slice(0, 200).replace(/\s+/g, " ");
      throw new Error(`${label} returned invalid JSON: ${msg}. Preview: ${preview}`);
    }
  }
}

/**
 * Best-effort repair for the most common Claude JSON mistake: unescaped
 * straight double-quotes inside a string value. The heuristic:
 *
 *   1. Strip markdown fences (```json ... ```) in case the model wrapped it.
 *   2. For each run of text between a `"key": "` opener and the next `",` or
 *      `"\n}` closer, escape any straight quote that isn't already escaped.
 *
 * This is intentionally conservative — it doesn't try to handle nested
 * objects, arrays, or keys with embedded quotes. It just fixes the one
 * pattern we see in practice. If the input is already valid JSON or the
 * damage is more complex, the caller's second JSON.parse will still throw.
 */
function repairJson(raw: string): string {
  let s = raw.trim();
  // 1. Strip fences.
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  // 2. Escape inner quotes. Matches: "key": "...content..."
  // and re-escapes any " inside `content` that isn't followed by , ] } or newline+}.
  s = s.replace(
    /("(?:title|body|notes|angle|rationale|claim|reason|suggested_fix|summary|source)"\s*:\s*")([\s\S]*?)("\s*(?:,|\n\s*[}\]]))/g,
    (_m, open, inner, close) => {
      const fixed = inner.replace(/(?<!\\)"/g, '\\"');
      return open + fixed + close;
    },
  );
  return s;
}
