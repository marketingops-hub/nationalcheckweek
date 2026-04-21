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
   *  edge-fn system prompt. */
  style_id:        z.string().uuid().optional(),
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

/* ─── PATCH draft (manual edits) ─────────────────────────────────────────── */

export const ContentDraftPatchSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  body:  z.string().max(50_000).optional(),
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
  draft:         ['verifying', 'archived'],
  verifying:     ['verified', 'rejected'],
  verified:      ['draft', 'archived'],    // "unlock" path back to editing
  rejected:      ['draft', 'archived'],    // fix + retry
  archived:      [],
};

export function canTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
