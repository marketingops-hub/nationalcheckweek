/* ═══════════════════════════════════════════════════════════════════════════
 * Zod validation schemas for Content Creator.
 *
 * Every payload coming from the admin UI is parsed through one of these before
 * it hits the DB or the edge function. Failures bubble up as 400s.
 *
 * The CHECK constraints in the migration are the last line of defence; these
 * schemas are the first, so rules are duplicated here intentionally (title for
 * long-form, platform-only-for-social, status transitions).
 * ═══════════════════════════════════════════════════════════════════════════ */

import { z } from 'zod';

export const ContentTypeSchema = z.enum(['social', 'blog', 'newsletter']);
export const SocialPlatformSchema = z.enum([
  'twitter',
  'linkedin',
  'facebook',
  'instagram',
]);

export const ContentStatusSchema = z.enum([
  'idea',
  'approved_idea',
  'generating',
  'draft',
  'verifying',
  'verified',
  'rejected',
  'archived',
]);

/* ─── Brief (user input) ───────────────────────────────────────────────── */

export const ContentBriefSchema = z.object({
  topic:           z.string().min(3, 'Topic must be at least 3 characters').max(500),
  tone:            z.string().max(120).optional(),
  audience:        z.string().max(120).optional(),
  keywords:        z.array(z.string().max(40)).max(20).optional(),
  vault_category:  z.string().max(60).optional(),
  /** When the brief was spawned from a content_topics row, track it here. */
  source_topic_id: z.string().uuid().optional(),
  /** Optional writing-style (content_writing_styles.id). Prepended to the
   *  edge-fn system prompt. Null is accepted so the PATCH route can
   *  explicitly clear a style the admin retired. */
  style_id:        z.string().uuid().nullable().optional(),
  /** For long-form only: admin toggle to generate / keep a title field.
   *  Social posts never have a title regardless. Defaults to true when
   *  missing, which matches pre-Apr-2026 behaviour. */
  include_title:   z.boolean().optional(),
  /** Free-text feedback captured from the "Request improvement" flow.
   *  The generate edge fn appends this to the user prompt so the next
   *  pass tries to address it. Cleared after a successful regen. */
  regeneration_feedback: z.string().max(2000).optional(),
  /** Per-draft length preference (see ContentBrief). Drives the word
   *  range the generate prompt asks the model to hit. Social posts
   *  ignore this field. */
  length_preset:   z.enum(['short', 'standard', 'long']).optional(),
});

/* ─── Stage 1: generate ideas (POST /api/admin/content-creator) ──────────── */

export const GenerateIdeasSchema = z
  .object({
    content_type: ContentTypeSchema,
    platform:     SocialPlatformSchema.optional(),
    brief:        ContentBriefSchema,
    count:        z.number().int().min(1).max(10).default(5),
  })
  .superRefine((val, ctx) => {
    // Platform is required for social, forbidden otherwise.
    if (val.content_type === 'social' && !val.platform) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['platform'],
        message: 'Platform is required for social posts.',
      });
    }
    if (val.content_type !== 'social' && val.platform) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['platform'],
        message: 'Platform is only valid for social posts.',
      });
    }
  });

/* ─── PATCH draft (manual edits) ─────────────────────────────────── */

/**
 * Patch shape sent from the draft detail page. title + body are the classic
 * fields; the trailing group (content_type, platform, brief_patch) lets the
 * admin retarget a draft mid-flight ("actually this should be a LinkedIn
 * post, not a blog"). Changing content_type re-runs the title rule in the
 * route handler and may wipe the existing title.
 */
export const ContentDraftPatchSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  body:  z.string().max(50_000).optional(),

  content_type: ContentTypeSchema.optional(),
  /** When moving into `social` the admin must also supply a platform;
   *  when moving out of `social` platform must be null. The route handler
   *  enforces this — the schema is deliberately permissive here. */
  platform:     SocialPlatformSchema.nullable().optional(),

  /** Shallow-merge patch for the draft's brief. Most usefully:
   *   - style_id             (change voice)
   *   - include_title        (long-form only)
   *   - regeneration_feedback (for the Request improvement flow)
   *  The route handler merges this over the existing brief rather than
   *  overwriting, so callers only need to send what changed. */
  brief_patch:  ContentBriefSchema.partial().optional(),
});

/* ─── Status transition (explicit, to avoid invalid jumps) ────────────────── */

/**
 * Allowed transitions. Anything else returns 409 from the API layer.
 * Mirrors the state machine diagram in the plan.
 */
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  idea:          ['approved_idea', 'archived'],
  approved_idea: ['generating', 'idea', 'archived'],  // 'idea' = unapprove
  generating:    ['draft', 'rejected'],
  // `generating` here enables the Request-improvement / regenerate flow
  // from either a fresh draft or a verified one.
  draft:         ['verifying', 'generating', 'archived'],
  verifying:     ['verified', 'rejected'],
  verified:      ['draft', 'generating', 'archived'],  // edit or regen
  rejected:      ['draft', 'generating', 'archived'],  // fix or regen
  archived:      [],
};

export function canTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
