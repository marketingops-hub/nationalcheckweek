/* ═══════════════════════════════════════════════════════════════════════════
 * Edge Function: simple-content
 *
 * Powers the Simplified Content creator. Two actions in one function:
 *
 *   action = "suggest_titles"
 *     • Fetches relevant Vault chunks for the admin's prompt.
 *     • Asks Claude to suggest 4 title options grounded in the Vault.
 *     • Returns: { titles: string[], vault_ids: string[] }
 *
 *   action = "generate"
 *     • Re-fetches Vault context for the chosen title + original prompt.
 *     • Asks Claude to write a full blog post, citing Vault facts inline
 *       with [vault:<id>] markers (same citation contract as the pipeline).
 *     • Citations are post-processed into numbered [Source N] markers and
 *       a Sources list is appended.
 *     • Returns: { title: string, body: string, vault_ids: string[] }
 *
 * POST body:
 *   { action: "suggest_titles", prompt: string }
 *   { action: "generate", prompt: string, title: string }
 *
 * ENV: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · ANTHROPIC_API_KEY
 *      OPENAI_API_KEY (optional — used by vault semantic search)
 * ═══════════════════════════════════════════════════════════════════════════ */

import {
  fetchVaultContext, formatVaultContext,
} from "../_shared/content-creator/vault.ts";
import { callAnthropic } from "../_shared/content-creator/anthropic.ts";
import { formatCitations } from "../_shared/content-creator/citations.ts";
import { safeParseJson, corsHeaders, json, readCtx, requireAuth } from "../_shared/content-creator/common.ts";
import { untrustedDataGuard, fenceField } from "../_shared/content-creator/prompt-safety.ts";

const VAULT_LIMIT = 12;

const MISSION = `You are writing for "National Check-in Week" — an Australian student wellbeing
and mental-health awareness campaign. Your audience is school principals, teachers,
parents, policy-makers and community members.

Every factual claim MUST be traceable to the VAULT block provided. If the vault
does not support a claim, do not make it.

${untrustedDataGuard()}`.trim();

/* ─── Title suggestion ───────────────────────────────────────────────────── */

async function suggestTitles(
  prompt: string,
  ctx: { sbUrl: string; sbKey: string; anthropicKey: string },
): Promise<{ titles: string[]; vault_ids: string[] }> {
  const vault = await fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
    topic: prompt,
    limit: VAULT_LIMIT,
    allow_broad_sample: true,
  });

  const system = `${MISSION}

Task: propose exactly 4 compelling blog-post title options for the topic the admin
has described. Each title must be grounded in what the vault actually contains —
do not suggest angles unsupported by the vault facts.

Return STRICT JSON only — no markdown, no preamble:
{
  "titles": ["Title one", "Title two", "Title three", "Title four"],
  "vault_ids": ["<uuid used to inform the suggestions>", ...]
}`;

  const user = `ADMIN PROMPT
${fenceField("prompt", prompt)}

VAULT (authoritative facts — ground your title suggestions here)
${formatVaultContext(vault)}

Return 4 title options now. JSON only.`;

  const result = await callAnthropic({
    apiKey: ctx.anthropicKey,
    system,
    user,
    maxTokens: 512,
    temperature: 0.7,
  });

  const parsed = safeParseJson<{ titles?: unknown; vault_ids?: unknown }>(result.content);
  const titles = Array.isArray(parsed?.titles)
    ? (parsed.titles as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 4)
    : [];
  const vault_ids = Array.isArray(parsed?.vault_ids)
    ? (parsed.vault_ids as unknown[]).filter((id): id is string => typeof id === "string")
    : vault.map((e) => e.id);

  if (titles.length === 0) throw new Error("Claude returned no title suggestions.");
  return { titles, vault_ids };
}

/* ─── Content generation ─────────────────────────────────────────────────── */

async function generateContent(
  prompt: string,
  title: string,
  ctx: { sbUrl: string; sbKey: string; anthropicKey: string },
): Promise<{ title: string; body: string; vault_ids: string[] }> {
  const vault = await fetchVaultContext(ctx.sbUrl, ctx.sbKey, {
    topic: `${title}. ${prompt}`,
    limit: VAULT_LIMIT,
  });

  const system = `${MISSION}

Task: write a complete blog post using the title below. Follow these rules exactly:
- Length: 600–900 words.
- Structure: hook paragraph → 3–4 sections with bold headings (**Section title**) → closing CTA.
- Do NOT use '#' markdown headings — use bold lines only (**Heading**).
- Every factual claim MUST carry an inline citation: [vault:<uuid>] using the exact
  uuid from the vault block. Opinion and CTA lines need no citation.
- Aim for at least one citation per 150 words.
- Tone: evidence-based, accessible, warm — suitable for educators and parents.

Return STRICT JSON only:
{
  "body": "the full blog post content",
  "vault_ids_used": ["uuid", ...]
}`;

  const user = `TITLE
${fenceField("title", title)}

CONTEXT (the original admin prompt)
${fenceField("prompt", prompt)}

VAULT (authoritative facts — your ONLY allowed source of statistics/claims)
${formatVaultContext(vault)}

Write the blog post now. Return JSON only.`;

  const result = await callAnthropic({
    apiKey: ctx.anthropicKey,
    system,
    user,
    maxTokens: 2000,
    temperature: 0.5,
  });

  const parsed = safeParseJson<{ body?: unknown; vault_ids_used?: unknown }>(result.content);
  const rawBody = typeof parsed?.body === "string" ? parsed.body : result.content;
  const usedIds = Array.isArray(parsed?.vault_ids_used)
    ? (parsed.vault_ids_used as unknown[]).filter((id): id is string => typeof id === "string")
    : [];

  // Post-process [vault:<uuid>] → [Source N] and append Sources list,
  // exactly as the full content pipeline does.
  const processedBody = formatCitations(rawBody, vault, "blog");

  return { title: title.trim(), body: processedBody, vault_ids: usedIds };
}

/* ─── Serve ──────────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authFail = requireAuth(req);
  if (authFail) return authFail;

  const ctxOrErr = readCtx({ requireAnthropic: true });
  if (ctxOrErr instanceof Response) return ctxOrErr;
  const ctx = ctxOrErr;
  if (!ctx.anthropicKey) return json({ error: "ANTHROPIC_API_KEY not set." }, 500);

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const action = body.action;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return json({ error: "prompt is required." }, 400);

  try {
    if (action === "suggest_titles") {
      const result = await suggestTitles(prompt, ctx as typeof ctx & { anthropicKey: string });
      return json(result);
    }

    if (action === "generate") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) return json({ error: "title is required for action=generate." }, 400);
      const result = await generateContent(prompt, title, ctx as typeof ctx & { anthropicKey: string });
      return json(result);
    }

    return json({ error: `Unknown action: ${String(action)}` }, 400);
  } catch (err) {
    console.error("[simple-content] error:", err instanceof Error ? err.message : err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error." }, 500);
  }
});
