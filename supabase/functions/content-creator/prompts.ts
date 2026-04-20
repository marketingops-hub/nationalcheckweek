/* ═══════════════════════════════════════════════════════════════════════════
 * Prompt builders for the Content Creator pipeline.
 *
 * One function per (stage × content_type) combination. All prompts share two
 * invariants:
 *   1. The vault block is THE source of truth. The model must not invent
 *      claims outside it.
 *   2. Output is strict JSON only — no markdown fences, no preamble.
 *
 * Keep prompt text here, not in index.ts, so they can be diffed in isolation.
 * ═══════════════════════════════════════════════════════════════════════════ */

// ── Platform constraints (mirrors src/lib/content-creator/platforms.ts — ────
//    duplicated because edge fns can't import from src/) ─────────────────────
const PLATFORM: Record<
  string,
  { label: string; maxChars: number; hashtagsOk: boolean; suggestedHashtags: number; toneHint: string }
> = {
  twitter:   { label: "X (Twitter)", maxChars: 280,  hashtagsOk: true,  suggestedHashtags: 2, toneHint: "punchy, plain-spoken, one idea per post" },
  linkedin:  { label: "LinkedIn",    maxChars: 3000, hashtagsOk: true,  suggestedHashtags: 3, toneHint: "professional but human, lead with insight, short paragraphs" },
  facebook:  { label: "Facebook",    maxChars: 2000, hashtagsOk: false, suggestedHashtags: 0, toneHint: "conversational, community-focused, invite discussion" },
  instagram: { label: "Instagram",   maxChars: 2200, hashtagsOk: true,  suggestedHashtags: 5, toneHint: "emotive opener, hook in first line, hashtags at the end" },
};

const MISSION = `
You are writing for "National Check-in Week" — an Australian student wellbeing
and mental-health awareness campaign. Your audience includes school principals,
teachers, parents, policy-makers and community members.

Every factual claim MUST be traceable to the VAULT block provided. If the vault
does not support a claim, do not make it. You may add general framing, calls
to action and opinion statements that do not contain statistics or factual
assertions.
`.trim();

/* ─── STAGE 1: IDEA GENERATION ──────────────────────────────────────────── */

export interface IdeaPromptInput {
  content_type: "social" | "blog" | "newsletter";
  platform?: string;
  brief: { topic: string; tone?: string; audience?: string; keywords?: string[] };
  vault_block: string;
  count: number;
}

export function buildIdeaPrompt(input: IdeaPromptInput): { system: string; user: string } {
  const typeLabel =
    input.content_type === "social"
      ? `a social post for ${PLATFORM[input.platform ?? "twitter"]?.label ?? "social"}`
      : `a ${input.content_type} post`;

  const system = `${MISSION}

Task: propose ${input.count} distinct content IDEAS for ${typeLabel}. Each idea
should be rooted in ONE or more of the provided vault entries.

Return STRICT JSON only:
{
  "ideas": [
    { "title": "short idea title", "summary": "1-2 sentence angle", "vault_ids": ["uuid", ...] }
  ]
}`.trim();

  const user = `BRIEF
topic:    ${input.brief.topic}
tone:     ${input.brief.tone ?? "(default: evidence-based, accessible)"}
audience: ${input.brief.audience ?? "(default: educators & parents)"}
keywords: ${(input.brief.keywords ?? []).join(", ") || "(none)"}

VAULT (authoritative facts)
${input.vault_block}

Produce ${input.count} ideas now. Return JSON only.`.trim();

  return { system, user };
}

/* ─── STAGE 2: CONTENT GENERATION ───────────────────────────────────────── */

export interface GeneratePromptInput {
  content_type: "social" | "blog" | "newsletter";
  platform?: string;
  idea: { title: string; summary: string };
  brief: { topic: string; tone?: string; audience?: string; keywords?: string[] };
  vault_block: string;
}

export function buildGeneratePrompt(input: GeneratePromptInput): { system: string; user: string } {
  const typeRules = typeSpecificRules(input.content_type, input.platform);

  const system = `${MISSION}

Task: write the ${input.content_type} post described by the approved idea below.
Follow the TYPE RULES exactly. Every factual claim MUST cite a vault id
inline like [vault:<uuid>]. You may omit citations only on opinion / CTA lines.

TYPE RULES
${typeRules}

Return STRICT JSON only:
{
  "title": ${input.content_type === "social" ? "null" : "\"headline string\""},
  "body": "the full content",
  "vault_ids_used": ["uuid", ...]
}`.trim();

  const user = `APPROVED IDEA
title:   ${input.idea.title}
summary: ${input.idea.summary}

BRIEF
topic:    ${input.brief.topic}
tone:     ${input.brief.tone ?? "(default)"}
audience: ${input.brief.audience ?? "(default)"}

VAULT (authoritative facts — your ONLY allowed source of statistics/claims)
${input.vault_block}

Write the ${input.content_type} now. Return JSON only.`.trim();

  return { system, user };
}

/** Renders the per-type / per-platform rule block for stage 2. */
function typeSpecificRules(type: "social" | "blog" | "newsletter", platform?: string): string {
  if (type === "social") {
    const cfg = PLATFORM[platform ?? "twitter"] ?? PLATFORM.twitter;
    return [
      `- Platform: ${cfg.label}`,
      `- Hard character limit: ${cfg.maxChars}. Aim for ~${Math.floor(cfg.maxChars * 0.9)}.`,
      `- Tone: ${cfg.toneHint}`,
      cfg.hashtagsOk
        ? `- Include ~${cfg.suggestedHashtags} relevant hashtags at the end.`
        : `- Do NOT use hashtags.`,
      `- title field MUST be null.`,
      `- No links unless explicitly present in a vault entry.`,
    ].join("\n");
  }
  if (type === "blog") {
    return [
      `- Length: 600–900 words.`,
      `- Structure: compelling headline (title field), 1-sentence hook, 3–5 H2 sections, conclusion with CTA.`,
      `- Tone: evidence-based, accessible, no jargon.`,
      `- title field REQUIRED (compelling, ≤ 70 chars).`,
      `- body should use simple markdown (## for subheads, - for lists).`,
    ].join("\n");
  }
  // newsletter
  return [
    `- Length: 300–500 words.`,
    `- Structure: punchy subject line (title field), greeting, 2–3 short paragraphs, clear CTA.`,
    `- Tone: warm, direct, conversational but credible.`,
    `- title field REQUIRED (subject line, ≤ 60 chars, avoids spam triggers).`,
    `- body should open with the reader's name placeholder "{{first_name}}" where natural.`,
  ].join("\n");
}

/* ─── STAGE 2b: ANTHROPIC IMPROVEMENT PASS ──────────────────────────────── */

export interface ImprovePromptInput {
  content_type: "social" | "blog" | "newsletter";
  platform?: string;
  draft: { title: string | null; body: string };
  vault_block: string;
}

export function buildImprovePrompt(input: ImprovePromptInput): { system: string; user: string } {
  const system = `${MISSION}

Task: improve the draft below WITHOUT adding any new factual claim. You may:
- Tighten language, fix grammar, improve flow.
- Re-order sentences.
- Soften or sharpen tone.

You MUST NOT:
- Introduce any statistic, number, or claim not already in the draft.
- Remove an existing [vault:<uuid>] citation unless you also delete the
  sentence it belongs to.

If you spot a claim in the draft that is NOT supported by the vault, DO NOT
rewrite it silently — flag it in "drift_warnings".

Return STRICT JSON only:
{
  "title": ${input.content_type === "social" ? "null" : "\"improved headline\""},
  "body": "improved body",
  "drift_warnings": ["claim X appears unsupported by vault", ...]
}`.trim();

  const user = `CURRENT DRAFT
title: ${input.draft.title ?? "(none — social post)"}
body:
${input.draft.body}

VAULT (authoritative facts)
${input.vault_block}

Return improved JSON now.`.trim();

  return { system, user };
}

/* ─── STAGE 3: VERIFICATION ─────────────────────────────────────────────── */

export interface VerifyPromptInput {
  content_type: "social" | "blog" | "newsletter";
  draft: { title: string | null; body: string };
  vault_block: string;
}

export function buildVerifyPrompt(input: VerifyPromptInput): { system: string; user: string } {
  const system = `${MISSION}

Task: extract EVERY verifiable factual claim from the draft and cross-check
each one against the VAULT. A claim is "supported" iff the vault contains an
entry that directly asserts the same fact (or a strict superset of it).

Return STRICT JSON only:
{
  "status": "verified" | "partially_verified" | "unverified",
  "confidence": "high" | "medium" | "low",
  "notes": "2-3 sentence summary of findings",
  "supported_claims": [
    { "claim": "exact sentence or clause from the draft", "vault_id": "uuid", "source": "url or citation" }
  ],
  "flagged_claims": [
    { "claim": "exact sentence", "reason": "not found in vault / partial match / contradicted", "suggested_fix": "how to fix (optional)" }
  ]
}

Rules:
- status = "verified" only if flagged_claims is empty.
- status = "partially_verified" if some claims are flagged but the core
  thesis is supported.
- status = "unverified" if the core thesis is not supported.`.trim();

  const user = `DRAFT TO VERIFY
${input.draft.title ? `TITLE: ${input.draft.title}\n` : ""}BODY:
${input.draft.body}

VAULT (authoritative facts — compare every claim against these)
${input.vault_block}

Return verdict JSON now.`.trim();

  return { system, user };
}
