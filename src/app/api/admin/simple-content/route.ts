/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/simple-content
 *
 * Self-contained handler — runs entirely in the Next.js Node runtime.
 * No Supabase edge function is needed.
 *
 * action = "suggest_titles"
 *   Fetches Vault context for the prompt, asks Claude for 4 title options.
 *   Returns: { titles: string[] }
 *
 * action = "generate"
 *   Fetches Vault context, writes a full blog post with vault citations,
 *   runs the citation post-processor, saves a history entry.
 *   Returns: { title: string, body: string, history_id: string, vault_refs: VaultRef[] }
 *
 * Body:
 *   { action: "suggest_titles", prompt: string }
 *   { action: "generate", prompt: string, title: string, feedback?: string, history_id?: string }
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { AnthropicService } from '@/lib/ai/anthropic-service';
import { fetchVaultContext, formatVaultContext } from '@/lib/content-creator/vault';
import { formatCitations } from '@/lib/content-creator/citations';
import { fenceField, untrustedDataGuard } from '@/lib/content-creator/prompt-safety';
import { safeParseJson } from '@/lib/content-creator/json';

export const runtime     = 'nodejs';
export const maxDuration = 120;

const VAULT_LIMIT = 12;

const anthropic = new AnthropicService();

export interface VaultRef {
  id:    string;
  title: string;
  source: string;
}

const MISSION = `You are writing for "National Check-in Week" — an Australian student wellbeing
and mental-health awareness campaign. Your audience is school principals, teachers,
parents, policy-makers and community members.

Every factual claim MUST be traceable to the VAULT block provided. If the vault
does not support a claim, do not make it.

${untrustedDataGuard()}`.trim();

/* ─── suggest_titles ─────────────────────────────────────────────────────── */

async function suggestTitles(prompt: string): Promise<NextResponse> {
  const vault = await fetchVaultContext({ topic: prompt, limit: VAULT_LIMIT, allow_broad_sample: true });

  if (vault.length === 0) {
    return NextResponse.json(
      { error: 'No vault content matched your prompt. Add relevant content to the Vault first, or broaden your prompt.' },
      { status: 422 },
    );
  }

  const system = `${MISSION}

Task: propose exactly 4 compelling blog-post title options for the topic the admin
has described. Each title must be grounded in what the vault actually contains.

Return STRICT JSON only — no markdown, no preamble:
{ "titles": ["Title one", "Title two", "Title three", "Title four"] }`;

  const user = `ADMIN PROMPT
${fenceField('prompt', prompt)}

VAULT (authoritative facts — ground your title suggestions here)
${formatVaultContext(vault)}

Return 4 title options now. JSON only.`;

  const result = await anthropic.generateContent(system, user, {
    model:       'gpt-4o',   // maps to claude-sonnet-4-6 via MODEL_MAPPING
    temperature: 0.7,
    maxTokens:   512,
    timeout:     90_000,
  });

  const parsed = safeParseJson<{ titles?: unknown }>(result.content, 'Claude title suggestions');
  const titles = Array.isArray(parsed?.titles)
    ? (parsed.titles as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 4)
    : [];

  if (titles.length === 0) {
    return NextResponse.json({ error: 'Claude returned no title suggestions.' }, { status: 502 });
  }
  return NextResponse.json({ titles });
}

/* ─── generate ───────────────────────────────────────────────────────────── */

async function generate(
  prompt: string,
  title: string,
  feedback: string | null,
  historyId: string | null,
): Promise<NextResponse> {
  const vault = await fetchVaultContext({ topic: `${title}. ${prompt}`, limit: VAULT_LIMIT });

  if (vault.length === 0) {
    return NextResponse.json(
      { error: 'No vault content matched this topic. Add relevant content to the Vault first, or try a different title.' },
      { status: 422 },
    );
  }

  const feedbackSection = feedback
    ? `\nEDITOR FEEDBACK ON PREVIOUS DRAFT (address these points in this version)\n${fenceField('feedback', feedback)}\n`
    : '';

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
{ "body": "the full blog post content", "vault_ids_used": ["uuid", ...] }`;

  const user = `TITLE
${fenceField('title', title)}

CONTEXT (the original admin prompt)
${fenceField('prompt', prompt)}
${feedbackSection}
VAULT (authoritative facts — your ONLY allowed source of statistics/claims)
${formatVaultContext(vault)}

Write the blog post now. Return JSON only.`;

  const result = await anthropic.generateContent(system, user, {
    model:       'gpt-4o',
    temperature: 0.5,
    maxTokens:   2000,
    timeout:     90_000,
  });

  const parsed  = safeParseJson<{ body?: unknown; vault_ids_used?: unknown }>(result.content, 'Claude blog post');
  const rawBody = typeof parsed?.body === 'string' ? parsed.body : null;
  if (!rawBody) {
    return NextResponse.json({ error: 'Claude returned an unexpected response format. Please try again.' }, { status: 502 });
  }

  const usedIds: string[] = Array.isArray(parsed?.vault_ids_used)
    ? (parsed.vault_ids_used as unknown[]).filter((id): id is string => typeof id === 'string')
    : [];

  const { body } = formatCitations(rawBody, vault, 'blog');

  // Build vault refs for UI display — only entries actually cited
  const citedSet = new Set(usedIds);
  const vaultRefs: VaultRef[] = vault
    .filter(e => citedSet.has(e.id))
    .map(e => ({ id: e.id, title: e.title, source: e.source }));

  // Persist (upsert) history entry
  const sb = adminClient();
  let savedHistoryId = historyId;
  if (historyId) {
    await sb
      .from('simple_content_history')
      .update({ title, body, feedback: feedback ?? null, vault_ids: usedIds })
      .eq('id', historyId);
  } else {
    const { data } = await sb
      .from('simple_content_history')
      .insert({ prompt, title, body, feedback: feedback ?? null, vault_ids: usedIds })
      .select('id')
      .single();
    savedHistoryId = (data as { id?: string } | null)?.id ?? null;
  }

  return NextResponse.json({ title: title.trim(), body, history_id: savedHistoryId, vault_refs: vaultRefs });
}

/* ─── Route handler ──────────────────────────────────────────────────────── */

export const POST = requireAdmin(async (req: NextRequest) => {
  let payload: unknown;
  try { payload = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { action, prompt: rawPrompt, title: rawTitle, feedback: rawFeedback, history_id: rawHistoryId } =
    (payload as { action?: unknown; prompt?: unknown; title?: unknown; feedback?: unknown; history_id?: unknown }) ?? {};

  const prompt = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
  if (!prompt)               return NextResponse.json({ error: 'prompt is required.' },          { status: 400 });
  if (prompt.length > 2000)  return NextResponse.json({ error: 'prompt must be ≤ 2000 chars.' }, { status: 400 });

  const feedback  = typeof rawFeedback  === 'string' ? rawFeedback.trim()  : null;
  const historyId = typeof rawHistoryId === 'string' ? rawHistoryId.trim() : null;

  try {
    if (action === 'suggest_titles') {
      return await suggestTitles(prompt);
    }

    if (action === 'generate') {
      const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
      if (!title)             return NextResponse.json({ error: 'title is required for action=generate.' }, { status: 400 });
      if (title.length > 200) return NextResponse.json({ error: 'title must be ≤ 200 chars.' },            { status: 400 });
      if (feedback && feedback.length > 1000) return NextResponse.json({ error: 'feedback must be ≤ 1000 chars.' }, { status: 400 });
      return await generate(prompt, title, feedback || null, historyId);
    }

    return NextResponse.json({ error: `Unknown action: ${String(action)}` }, { status: 400 });

  } catch (err) {
    console.error('[simple-content]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 },
    );
  }
});
