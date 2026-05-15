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

import { densityPromptRule } from "./density.ts";
import { wordTarget } from "./length.ts";

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

/* ─── STAGE 0: TOPIC GENERATION ─────────────────────────────────────────── */

export interface TopicPromptInput {
  vault_block:    string;
  vault_category: string;       // 'all' or a real category name
  seed?:          string;       // optional admin-supplied focus
  count:          number;
}

/**
 * Topic generation happens BEFORE ideas / content. Given a slice of the vault,
 * the model proposes reusable content topics — broad angles that can later
 * spawn multiple ideas. Output constrained to strict JSON so the admin UI can
 * render cards without markdown parsing.
 *
 * Why we ask for source_document_ids:
 *   - Provenance for the admin to trust the angle
 *   - Lets the UI show chips linking back to the original documents
 *   - The edge function filters out hallucinated IDs before persisting
 */
export function buildTopicPrompt(input: TopicPromptInput): { system: string; user: string } {
  const system = `${MISSION}

Task: propose ${input.count} distinct CONTENT TOPICS for future posts. Each
topic should be a broad angle that could spawn multiple blog / social /
newsletter pieces, not a single tweet.

Ground every topic in ONE or more vault documents. If the vault is thin,
return fewer topics rather than inventing material.

Return STRICT JSON only:
{
  "topics": [
    {
      "title":              "short catchy title (<= 120 chars)",
      "angle":              "2-3 sentence hook / POV",
      "rationale":          "why this angle emerges from the vault",
      "suggested_keywords": ["3-6 keywords"],
      "suggested_audience": "who this is for (short phrase)",
      "suggested_tone":     "tone hint (short phrase)",
      "source_document_ids": ["uuid", ...]
    }
  ]
}`.trim();

  const seedLine = input.seed
    ? `Admin seed (focus these topics around this angle): ${input.seed}`
    : `(no admin seed — pick the strongest distinct angles from the vault)`;

  const user = `SCOPE
category: ${input.vault_category}
${seedLine}

VAULT (authoritative facts — do NOT invent beyond this)
${input.vault_block}

Produce ${input.count} distinct topics now. Return JSON only.`.trim();

  return { system, user };
}

/* ─── STAGE 1: IDEA GENERATION ──────────────────────────────────────────── */

export interface IdeaPromptInput {
  content_type: "social" | "blog" | "newsletter";
  platform?: string;
  brief: { topic: string; tone?: string; audience?: string; keywords?: string[] };
  vault_block: string;
  count: number;
  /** Optional writing-style directive, prepended to the system message. */
  style_prompt?: string;
  /** Optional rendered STYLE EXAMPLES block (from buildStyleExamplesBlock).
   *  Already a full block with heading — interpolated as-is. */
  style_examples_block?: string;
}

export function buildIdeaPrompt(input: IdeaPromptInput): { system: string; user: string } {
  const typeLabel =
    input.content_type === "social"
      ? `a social post for ${PLATFORM[input.platform ?? "twitter"]?.label ?? "social"}`
      : `a ${input.content_type} post`;

  // Writing-style block (if any) sits ABOVE the mission so the model reads
  // "you are this kind of writer" before it reads the vault discipline.
  // Falls back to an empty string when no style is selected, so we don't
  // leave ghost headers in the prompt.
  const stylePrefix = input.style_prompt
    ? `WRITING STYLE\n${input.style_prompt.trim()}\n\n`
    : "";
  // Few-shot examples land between the style directive and the mission
  // so the model has "you are this voice → here's what it sounds like"
  // in reading order. Empty string when no examples are configured.
  const examplesBlock = input.style_examples_block
    ? `${input.style_examples_block.trim()}\n\n`
    : "";

  const system = `${stylePrefix}${examplesBlock}${MISSION}

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
  content_type: "social" | "blog" | "newsletter" | "geo";
  platform?: string;
  idea: { title: string; summary: string };
  brief: { topic: string; tone?: string; audience?: string; keywords?: string[] };
  vault_block: string;
  /**
   * GEO-only. Pre-rendered block of local context about the area (town)
   * the article is being written about — sourced from the `areas` table's
   * `issues` JSON + `overview` + key stats. Treated as an additional
   * citable source under [area:<area-slug>] markers. Omitted for other
   * content types.
   */
  area_context?: string;
  /** Slug of the area attached to a GEO draft. Used to interpolate the
   *  literal citation token the model should emit. Required when
   *  content_type === 'geo'. */
  area_slug?: string;
  /** Optional writing-style directive, prepended to the system message. */
  style_prompt?: string;
  /** Optional rendered STYLE EXAMPLES block (from buildStyleExamplesBlock). */
  style_examples_block?: string;
  /**
   * Free-text feedback captured from the "Request improvement" flow.
   * When present, the user prompt gains a FEEDBACK section and the model
   * is told explicitly to address those notes.
   */
  regeneration_feedback?: string;
  /**
   * The draft produced by a previous run. Sent alongside `regeneration_feedback`
   * so the model can see what it's rewriting, not just an abstract set of notes.
   */
  previous_draft?: { title: string | null; body: string };
  /**
   * For long-form only. When false, the model is instructed to return
   * `title: null` and the body must not rely on a headline. Defaults to true.
   */
  include_title?: boolean;
  /**
   * Optional admin-picked length hint (from the "Generate options" modal).
   * 'short' / 'long' scale the word range the prompt asks for; undefined
   * or 'standard' keeps the baseline per content_type. Social ignored.
   */
  length_preset?: "short" | "standard" | "long";
}

export function buildGeneratePrompt(input: GeneratePromptInput): { system: string; user: string } {
  const typeRules = typeSpecificRules(input.content_type, input.platform, input.length_preset);
  const isGeo = input.content_type === "geo";

  const stylePrefix = input.style_prompt
    ? `WRITING STYLE\n${input.style_prompt.trim()}\n\n`
    : "";
  const examplesBlock = input.style_examples_block
    ? `${input.style_examples_block.trim()}\n\n`
    : "";

  // Title is null for social, OR for long-form with include_title === false.
  const wantsTitle = input.content_type !== "social"
    && input.include_title !== false;

  const titleRule = wantsTitle
    ? `title field REQUIRED.`
    : `title field MUST be null. Open the body with the hook directly — no headline line.`;

  // GEO-only: teach the model about the [area:<slug>] citation token so
  // it can ground claims that come from the local-context block (as
  // opposed to the general Vault). Both forms count as supported
  // citations during verification.
  const geoCitationRule = isGeo && input.area_slug
    ? `\n- GEO LOCAL CONTEXT: for any claim sourced from the AREA CONTEXT block (local stats, severity, local prevention efforts), cite it inline as [area:${input.area_slug}] instead of [vault:<uuid>]. Every local claim MUST carry this marker.`
    : "";

  const system = `${stylePrefix}${examplesBlock}${MISSION}

Task: write the ${input.content_type} post described by the approved idea below.
Follow the TYPE RULES exactly. Every factual claim MUST cite a vault id
inline like [vault:<uuid>]. You may omit citations only on opinion / CTA lines.

CITATION FORMAT — IMPORTANT
- Use EXACTLY the form [vault:<uuid>] with the raw uuid from the vault block.
- Do NOT pre-number citations, do NOT invent URLs, do NOT write "(Source N)".
- A post-processor replaces [vault:<uuid>] with [Source N] for long-form and
  [N] for social, and appends a Sources list at the end of long-form pieces.
- For SOCIAL posts, cite sparingly — each [vault:<uuid>] marker is ~45 chars
  and will shrink to ~4 chars after post-processing, but the uuid still
  counts toward your output token budget. One or two citations is plenty.${geoCitationRule}

TITLE RULE
- ${titleRule}

TYPE RULES
${typeRules}

Return STRICT JSON only:
{
  "title": ${wantsTitle ? "\"headline string\"" : "null"},
  "body": "the full content",
  "vault_ids_used": ["uuid", ...]
}`.trim();

  // Regeneration sections: include the previous draft (so the model has
  // concrete material to rewrite) and the admin's feedback (the change
  // they actually want). Both are optional — a fresh generate has neither.
  const feedback = input.regeneration_feedback?.trim();
  const prev     = input.previous_draft;

  const regenBlock = feedback
    ? `\n\nADMIN FEEDBACK (address these notes — this is a rewrite, not a fresh draft)\n${feedback}`
    : "";

  const prevBlock = prev
    ? `\n\nPREVIOUS DRAFT (for reference — improve on this, don't regress)\n${prev.title ? `title: ${prev.title}\n` : ""}body:\n${prev.body}`
    : "";

  // GEO-only: the area's local issues/overview land as a dedicated block
  // so the model can weave town-specific detail into the article without
  // those facts leaking out of the citation contract.
  const areaBlock = isGeo && input.area_context
    ? `\n\nAREA CONTEXT (local data for this town — cite as [area:${input.area_slug}])\n${input.area_context}`
    : "";

  const user = `APPROVED IDEA
title:   ${input.idea.title}
summary: ${input.idea.summary}

BRIEF
topic:    ${input.brief.topic}
tone:     ${input.brief.tone ?? "(default)"}
audience: ${input.brief.audience ?? "(default)"}${regenBlock}${prevBlock}${areaBlock}

VAULT (authoritative facts — your ONLY allowed source of statistics/claims${isGeo ? ", alongside AREA CONTEXT above" : ""})
${input.vault_block}

Write the ${input.content_type} now. Return JSON only.`.trim();

  return { system, user };
}

/** Renders the per-type / per-platform rule block for stage 2. The evidence-
 *  density line is centralised in density.ts so the verifier sees the same
 *  rule the writer does.
 *
 *  `length_preset` scales the stated word range — 'short' / 'long' come from
 *  the "Generate options" modal; undefined and 'standard' keep the baseline.
 *  Range numbers are computed in length.ts · wordTarget so a single source
 *  of truth drives both the prompt and the post-generation length gate. */
function typeSpecificRules(
  type: "social" | "blog" | "newsletter" | "geo",
  platform?: string,
  length_preset?: "short" | "standard" | "long",
): string {
  const densityRule = densityPromptRule(type);

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
      densityRule,
    ].join("\n");
  }

  // Long-form: pull the scaled range from the shared helper so the prompt
  // rule and the length gate can never drift apart.
  const target = wordTarget(type, length_preset);
  const lengthLine = target
    ? `- Length: ${target.min}–${target.max} words.`
    // wordTarget returns null for social; long-form always returns a range,
    // but keep a defensive fallback so a future content_type addition
    // doesn't explode the prompt.
    : `- Length: as appropriate for the format.`;

  if (type === "blog") {
    return [
      lengthLine,
      `- Structure: compelling headline (title field), 1-sentence hook, 3–5 section breaks, conclusion with CTA.`,
      `- Tone: evidence-based, accessible, no jargon.`,
      `- title field REQUIRED (compelling, ≤ 70 chars).`,
      // Admin rule (Apr 2026): NO '#' markdown headings anywhere in the
      // body — they render as literal hashes in our CMS. Use bold for
      // section titles and plain paragraphs for flow.
      `- body MUST NOT use '#' markdown headings. For section breaks use a bold line like **Section title** on its own line. Bulleted lists are fine ('- item').`,
      densityRule,
    ].join("\n");
  }

  if (type === "geo") {
    // GEO pages pair an Australian town with a wellbeing issue and must
    // read as genuinely local, not as generic national copy sprinkled
    // with place-names. Structure is tighter than blog because we want
    // crawlable sub-sections for SEO.
    return [
      lengthLine,
      `- MUST mention the town by name repeatedly and naturally — aim for the area name in the title, the opening hook, and at least 3 section breaks.`,
      `- Structure: local hook (what's happening in this town) → the issue explained with Vault data → local angle / AREA CONTEXT data → what schools & families in this town can do → local CTA.`,
      `- Every town-specific claim cites [area:<slug>]; every national claim cites [vault:<uuid>]. Do not blur the two.`,
      `- Tone: evidence-based, locally-aware, no jargon. This is an SEO landing page, not an op-ed.`,
      `- title field REQUIRED (compelling, includes the town and the issue, ≤ 80 chars).`,
      `- body MUST NOT use '#' markdown headings. Use bold lines (**Section title**) for section breaks.`,
      densityRule,
    ].join("\n");
  }
  // newsletter
  return [
    lengthLine,
    `- Structure: punchy subject line (title field), greeting, 2–3 short paragraphs, clear CTA.`,
    `- Tone: warm, direct, conversational but credible.`,
    `- title field REQUIRED (subject line, ≤ 60 chars, avoids spam triggers).`,
    `- body should open with the reader's name placeholder "{{first_name}}" where natural.`,
    densityRule,
  ].join("\n");
}

/* ─── STAGE 2b: ANTHROPIC IMPROVEMENT PASS ──────────────────────────────── */

export interface ImprovePromptInput {
  content_type: "social" | "blog" | "newsletter" | "geo";
  platform?: string;
  draft: { title: string | null; body: string };
  vault_block: string;
  /** GEO-only: optional local-context block, treated as an additional
   *  allowed source during the improvement pass so the model doesn't
   *  strip area-specific detail thinking it's unverified. */
  area_context?: string;
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
}

JSON QUOTING RULES — CRITICAL
- The entire response MUST be valid RFC-8259 JSON.
- Inside any string value, every literal double-quote MUST be escaped as \\".
- Prefer curly quotes (", ", ', ') or single quotes for internal quotations
  so straight \\" is rarely needed.
- Example — WRONG: "body": "So-called "soft skills" matter."
- Example — RIGHT: "body": "So-called \\"soft skills\\" matter."
- Example — RIGHT: "body": "So-called 'soft skills' matter."
- Do not wrap the JSON in markdown fences.`.trim();

  const areaBlock = input.content_type === "geo" && input.area_context
    ? `\n\nAREA CONTEXT (local data — treat as an additional allowed source)\n${input.area_context}`
    : "";

  const user = `CURRENT DRAFT
title: ${input.draft.title ?? "(none — social post)"}
body:
${input.draft.body}

VAULT (authoritative facts)
${input.vault_block}${areaBlock}

Return improved JSON now.`.trim();

  return { system, user };
}

/* ─── STAGE 3: VERIFICATION ─────────────────────────────────────────────── */

export interface VerifyPromptInput {
  content_type: "social" | "blog" | "newsletter" | "geo";
  draft: { title: string | null; body: string };
  vault_block: string;
  /** GEO-only: pre-rendered area_context that the verifier is allowed to
   *  treat as a supporting source (cited in-body as [area:<slug>]). */
  area_context?: string;
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
- status = "unverified" if the core thesis is not supported.

EVIDENCE DENSITY (the draft was written under this rule — flag if violated)
${densityPromptRule(input.content_type)}${
    input.content_type === "geo"
      ? "\n\nGEO LOCAL-CONTEXT RULE\nClaims cited as [area:<slug>] must match the AREA CONTEXT block below. Treat those as supported; do not flag them for missing from Vault."
      : ""
  }`.trim();

  const areaBlock = input.content_type === "geo" && input.area_context
    ? `\n\nAREA CONTEXT (local data — compare [area:<slug>] claims against this)\n${input.area_context}`
    : "";

  const user = `DRAFT TO VERIFY
${input.draft.title ? `TITLE: ${input.draft.title}\n` : ""}BODY:
${input.draft.body}

VAULT (authoritative facts — compare every claim against these)
${input.vault_block}${areaBlock}

Return verdict JSON now.`.trim();

  return { system, user };
}
