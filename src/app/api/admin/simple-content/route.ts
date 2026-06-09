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
 *   Fetches Vault context, writes content grounded in the Vault,
 *   runs the citation post-processor, saves a history entry.
 *   Returns: { title: string, body: string, history_id: string, vault_refs: VaultRef[] }
 *
 * Body:
 *   { action: "suggest_titles", prompt: string, content_type?: ContentType }
 *   { action: "generate", prompt: string, title: string, content_type?: ContentType,
 *     feedback?: string, history_id?: string }
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
const anthropic   = new AnthropicService();

/* ─── Content-type config ────────────────────────────────────────────────── */

export type ContentType =
  | 'blog_article'
  | 'short_article'
  | 'linkedin'
  | 'instagram'
  | 'newsletter';

export interface VaultRef {
  id:     string;
  title:  string;
  source: string;
}

interface ContentTypeConfig {
  label:        string;
  wordRange:    string;
  maxTokens:    number;
  citStyle:     'blog' | 'newsletter' | 'social';
  instructions: string;
}

const CONTENT_CONFIGS: Record<ContentType, ContentTypeConfig> = {
  blog_article: {
    label:     'Blog Article',
    wordRange: '600–900 words',
    maxTokens: 2000,
    citStyle:  'blog',
    instructions: `Write a complete blog post. Follow these rules:
- Length: 600–900 words.
- Structure: hook paragraph → 3–4 sections with bold headings (**Section title**) → closing call-to-action.
- Do NOT use '#' markdown headings — use bold lines only (**Heading**).
- Every factual claim MUST carry an inline citation: [vault:<uuid>]
- Aim for at least one citation per 150 words.
- Tone: evidence-based, accessible, warm — suitable for educators and parents.`,
  },
  short_article: {
    label:     'Short Article',
    wordRange: '300–400 words',
    maxTokens: 1000,
    citStyle:  'blog',
    instructions: `Write a concise article. Follow these rules:
- Length: 300–400 words.
- Structure: one opening paragraph → 2–3 short sections with bold headings → one closing sentence.
- Do NOT use '#' markdown headings — use bold lines only (**Heading**).
- Cite key facts with [vault:<uuid>].
- Tone: punchy and direct — suitable for a busy school newsletter.`,
  },
  linkedin: {
    label:     'LinkedIn Post',
    wordRange: '200–300 words',
    maxTokens: 700,
    citStyle:  'social',
    instructions: `Write a LinkedIn post. Follow these rules:
- Length: 200–300 words.
- Start with a strong hook line (single sentence, no heading).
- Use short paragraphs (1–3 sentences each) with blank lines between them.
- Ground key claims in vault facts; cite sparingly with [vault:<uuid>] only for statistics.
- End with a question or call-to-action to encourage engagement.
- Tone: professional but human, conversational.
- Do NOT use hashtags.`,
  },
  instagram: {
    label:     'Instagram Caption',
    wordRange: '100–150 words + hashtags',
    maxTokens: 500,
    citStyle:  'social',
    instructions: `Write an Instagram caption. Follow these rules:
- Length: 100–150 words of body copy.
- Start with an attention-grabbing first line (this shows before "more").
- Keep paragraphs to 1–2 sentences.
- You may cite one key statistic with [vault:<uuid>].
- End with 8–12 relevant hashtags on a new line (e.g. #StudentWellbeing #MentalHealth).
- Tone: warm, encouraging, community-focused.`,
  },
  newsletter: {
    label:     'Newsletter Section',
    wordRange: '250–350 words',
    maxTokens: 900,
    citStyle:  'newsletter',
    instructions: `Write a newsletter section. Follow these rules:
- Length: 250–350 words.
- Structure: short intro sentence → 2–3 paragraphs of body → one-line "Key takeaway:" at the end.
- Cite key facts with [vault:<uuid>].
- Tone: informative and collegial — written for school staff or parents reading a digest.
- Do NOT use bold headings.`,
  },
};

const DEFAULT_CONTENT_TYPE: ContentType = 'blog_article';

function resolveContentType(raw: unknown): ContentType {
  if (typeof raw === 'string' && raw in CONTENT_CONFIGS) return raw as ContentType;
  return DEFAULT_CONTENT_TYPE;
}

/* ─── Shared mission prompt ──────────────────────────────────────────────── */

const MISSION = `You are writing for "National Check-in Week" — an Australian student wellbeing
and mental-health awareness campaign. Your audience is school principals, teachers,
parents, policy-makers and community members.

Every factual claim MUST be traceable to the VAULT block provided. If the vault
does not support a claim, do not make it.

${untrustedDataGuard()}`.trim();

/* ─── suggest_titles ─────────────────────────────────────────────────────── */

async function suggestTitles(prompt: string, contentType: ContentType): Promise<NextResponse> {
  const vault = await fetchVaultContext({ topic: prompt, limit: VAULT_LIMIT, allow_broad_sample: true });

  if (vault.length === 0) {
    return NextResponse.json(
      { error: 'No vault content matched your prompt. Add relevant content to the Vault first, or broaden your prompt.' },
      { status: 422 },
    );
  }

  const { label, wordRange } = CONTENT_CONFIGS[contentType];

  const system = `${MISSION}

Task: propose exactly 4 compelling title options for a ${label} (${wordRange}) on the topic
the admin has described. Each title must be grounded in what the vault actually contains.

Return STRICT JSON only — no markdown, no preamble:
{ "titles": ["Title one", "Title two", "Title three", "Title four"] }`;

  const user = `ADMIN PROMPT
${fenceField('prompt', prompt)}

VAULT (authoritative facts — ground your title suggestions here)
${formatVaultContext(vault)}

Return 4 title options now. JSON only.`;

  const result = await anthropic.generateContent(system, user, {
    model:       'gpt-4o',
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
  contentType: ContentType,
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

  const cfg = CONTENT_CONFIGS[contentType];

  const feedbackSection = feedback
    ? `\nEDITOR FEEDBACK ON PREVIOUS DRAFT (address these points in this version)\n${fenceField('feedback', feedback)}\n`
    : '';

  const system = `${MISSION}

${cfg.instructions}

Use the vault UUIDs exactly as given: [vault:<uuid>]
Return STRICT JSON only:
{ "body": "the full content", "vault_ids_used": ["uuid", ...] }`;

  const user = `TITLE
${fenceField('title', title)}

CONTENT TYPE: ${cfg.label} (${cfg.wordRange})

CONTEXT (the original admin prompt)
${fenceField('prompt', prompt)}
${feedbackSection}
VAULT (authoritative facts — your ONLY allowed source of statistics/claims)
${formatVaultContext(vault)}

Write the ${cfg.label} now. Return JSON only.`;

  const result = await anthropic.generateContent(system, user, {
    model:       'gpt-4o',
    temperature: 0.5,
    maxTokens:   cfg.maxTokens,
    timeout:     90_000,
  });

  const parsed  = safeParseJson<{ body?: unknown; vault_ids_used?: unknown }>(result.content, 'Claude content');
  const rawBody = typeof parsed?.body === 'string' ? parsed.body : null;
  if (!rawBody) {
    return NextResponse.json({ error: 'Claude returned an unexpected response format. Please try again.' }, { status: 502 });
  }

  const usedIds: string[] = Array.isArray(parsed?.vault_ids_used)
    ? (parsed.vault_ids_used as unknown[]).filter((id): id is string => typeof id === 'string')
    : [];

  const { body } = formatCitations(rawBody, vault, cfg.citStyle);

  // Build vault refs for UI display — only entries actually cited
  const citedSet  = new Set(usedIds);
  const vaultRefs: VaultRef[] = vault
    .filter(e => citedSet.has(e.id))
    .map(e => ({ id: e.id, title: e.title, source: e.source }));

  // Persist / update history entry (best-effort)
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

  const {
    action,
    prompt:       rawPrompt,
    title:        rawTitle,
    content_type: rawContentType,
    feedback:     rawFeedback,
    history_id:   rawHistoryId,
  } = (payload as Record<string, unknown>) ?? {};

  const prompt      = typeof rawPrompt  === 'string' ? rawPrompt.trim()  : '';
  const contentType = resolveContentType(rawContentType);
  const feedback    = typeof rawFeedback  === 'string' ? rawFeedback.trim()  : null;
  const historyId   = typeof rawHistoryId === 'string' ? rawHistoryId.trim() : null;

  if (!prompt)              return NextResponse.json({ error: 'prompt is required.' },          { status: 400 });
  if (prompt.length > 2000) return NextResponse.json({ error: 'prompt must be ≤ 2000 chars.' }, { status: 400 });

  try {
    if (action === 'suggest_titles') {
      return await suggestTitles(prompt, contentType);
    }

    if (action === 'generate') {
      const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
      if (!title)             return NextResponse.json({ error: 'title is required for action=generate.' }, { status: 400 });
      if (title.length > 200) return NextResponse.json({ error: 'title must be ≤ 200 chars.' },            { status: 400 });
      if (feedback && feedback.length > 1000) return NextResponse.json({ error: 'feedback must be ≤ 1000 chars.' }, { status: 400 });
      return await generate(prompt, title, contentType, feedback || null, historyId);
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
