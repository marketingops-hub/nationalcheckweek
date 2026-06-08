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
 *   runs the citation post-processor.
 *   Returns: { title: string, body: string }
 *
 * Body: { action: "suggest_titles" | "generate", prompt: string, title?: string }
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { AnthropicService } from '@/lib/ai/anthropic-service';
import { fetchVaultContext, formatVaultContext } from '@/lib/content-creator/vault';
import { formatCitations } from '@/lib/content-creator/citations';
import { fenceField, untrustedDataGuard } from '@/lib/content-creator/prompt-safety';
import { safeParseJson } from '@/lib/content-creator/json';

export const runtime     = 'nodejs';
export const maxDuration = 120;

const VAULT_LIMIT = 12;

const anthropic = new AnthropicService();

const MISSION = `You are writing for "National Check-in Week" — an Australian student wellbeing
and mental-health awareness campaign. Your audience is school principals, teachers,
parents, policy-makers and community members.

Every factual claim MUST be traceable to the VAULT block provided. If the vault
does not support a claim, do not make it.

${untrustedDataGuard()}`.trim();

/* ─── suggest_titles ─────────────────────────────────────────────────────── */

async function suggestTitles(prompt: string): Promise<NextResponse> {
  const vault = await fetchVaultContext({ topic: prompt, limit: VAULT_LIMIT, allow_broad_sample: true });

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

async function generate(prompt: string, title: string): Promise<NextResponse> {
  const vault = await fetchVaultContext({ topic: `${title}. ${prompt}`, limit: VAULT_LIMIT });

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

VAULT (authoritative facts — your ONLY allowed source of statistics/claims)
${formatVaultContext(vault)}

Write the blog post now. Return JSON only.`;

  const result = await anthropic.generateContent(system, user, {
    model:       'gpt-4o',
    temperature: 0.5,
    maxTokens:   2000,
  });

  const parsed    = safeParseJson<{ body?: unknown }>(result.content, 'Claude blog post');
  const rawBody   = typeof parsed?.body === 'string' ? parsed.body : result.content;
  const { body }  = formatCitations(rawBody, vault, 'blog');

  return NextResponse.json({ title: title.trim(), body });
}

/* ─── Route handler ──────────────────────────────────────────────────────── */

export const POST = requireAdmin(async (req: NextRequest) => {
  let payload: unknown;
  try { payload = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { action, prompt: rawPrompt, title: rawTitle } =
    (payload as { action?: unknown; prompt?: unknown; title?: unknown }) ?? {};

  const prompt = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
  if (!prompt)               return NextResponse.json({ error: 'prompt is required.' },          { status: 400 });
  if (prompt.length > 2000)  return NextResponse.json({ error: 'prompt must be ≤ 2000 chars.' }, { status: 400 });

  try {
    if (action === 'suggest_titles') {
      return await suggestTitles(prompt);
    }

    if (action === 'generate') {
      const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
      if (!title)             return NextResponse.json({ error: 'title is required for action=generate.' }, { status: 400 });
      if (title.length > 200) return NextResponse.json({ error: 'title must be ≤ 200 chars.' },            { status: 400 });
      return await generate(prompt, title);
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
