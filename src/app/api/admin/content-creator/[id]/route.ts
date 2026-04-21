/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/content-creator/[id]
 *
 * GET    → fetch one draft
 * PATCH  → manual edits: title, body, content_type, platform, brief_patch
 * DELETE → soft-delete (?hard=true for permanent)
 *
 * The PATCH surface got richer in Apr 2026 — the draft detail page now
 * offers content-type / platform / include-title / style toggles, and
 * all of them flow through this one endpoint via `brief_patch` shallow
 * merges. Guards:
 *
 *   - Cannot edit while an AI stage is in flight (generating / verifying)
 *   - content_type ↔ platform rules match the DB CHECK (social iff platform)
 *   - Changing content_type away from social wipes `platform` automatically
 *   - Changing content_type *to* social requires an explicit platform and
 *     nulls any existing title (DB CHECK blocks a titled social post)
 *   - Manual edits to verified content demote back to 'draft' and clear
 *     the stale verification verdict + approval flag
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { ContentDraftPatchSchema } from '@/lib/content-creator/schemas';
import type { ContentBrief } from '@/lib/content-creator/types';
import {
  ok, err, pgError, parseJsonBody, validate, readParams,
} from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);

  const { data, error } = await adminClient()
    .from('content_drafts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return pgError(error);
  return ok({ draft: data });
});

export const PATCH = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);

  const body = await parseJsonBody(req);
  if (body instanceof NextResponse) return body;

  const input = validate(ContentDraftPatchSchema, body);
  if (input instanceof NextResponse) return input;

  const sb = adminClient();

  // Fetch full current row — we need brief + verification for merging.
  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, content_type, platform, status, title, brief, verification')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  // Guard: never mutate a row while the edge fn is mid-flight. The AI
  // chain expects to find the same brief it was called with.
  if (current.status === 'generating' || current.status === 'verifying') {
    return err(`Cannot edit while status = ${current.status}`, 409);
  }

  /* ── Compute new content_type + platform together ─────────────────────── */

  const nextContentType = input.content_type ?? current.content_type;
  const typeChanging    = nextContentType !== current.content_type;

  let nextPlatform: string | null = current.platform;
  if ('platform' in input)   nextPlatform = input.platform ?? null;
  if (typeChanging && nextContentType !== 'social') nextPlatform = null;

  if (nextContentType === 'social' && !nextPlatform) {
    return err('Platform is required for social posts.', 400);
  }
  if (nextContentType !== 'social' && nextPlatform) {
    return err(`Platform is not valid for ${nextContentType} posts.`, 400);
  }

  /* ── Title rules ──────────────────────────────────────────────────────── */

  // Explicit title in the patch wins. If the admin is also flipping the
  // type, we reconcile that below.
  let nextTitle: string | null | undefined =
    'title' in input ? (input.title ?? null) : undefined;

  // Flipping TO social wipes the title unconditionally — DB CHECK would
  // reject a titled social row and the UI can't reach it anyway.
  if (typeChanging && nextContentType === 'social') {
    nextTitle = null;
  }

  // Flipping FROM social requires a non-empty title. The admin must supply
  // one in the same PATCH — we can't invent one.
  if (typeChanging && current.content_type === 'social' && nextContentType !== 'social') {
    if (!nextTitle || nextTitle.trim() === '') {
      return err(
        `${nextContentType} posts require a title — supply one when changing type.`,
        400,
      );
    }
  }

  // Same-type title validation.
  if (!typeChanging && nextTitle !== undefined) {
    if (nextContentType === 'social' && nextTitle != null) {
      return err('Social posts cannot have a title.', 400);
    }
    if (nextContentType !== 'social' && (!nextTitle || nextTitle.trim() === '')) {
      // include_title=false from brief_patch can waive the requirement.
      const nextIncludeTitle =
        input.brief_patch?.include_title ?? current.brief?.include_title ?? true;
      if (nextIncludeTitle) {
        return err(`${nextContentType} posts require a title.`, 400);
      }
    }
  }

  /* ── Brief merge ──────────────────────────────────────────────────────── */

  // Shallow merge, but scrub keys the caller explicitly nulled — storing
  // `style_id: null` would keep the key in the JSONB column and the edge
  // fn would then re-enter the "style no longer applies" branch every
  // run. Null here means "unset", so we delete rather than overwrite.
  let nextBrief: ContentBrief | undefined;
  if (input.brief_patch) {
    const merged: Record<string, unknown> = {
      ...(current.brief ?? {}),
      ...input.brief_patch,
    };
    for (const [k, v] of Object.entries(input.brief_patch)) {
      if (v === null) delete merged[k];
    }
    // Cast via unknown: `topic` is technically required on ContentBrief
    // but we're merging onto the existing brief which already has one,
    // so the runtime shape is safe even when TS can't prove it.
    nextBrief = merged as unknown as ContentBrief;
  }

  /* ── Assemble the actual update payload ───────────────────────────────── */

  const patch: Record<string, unknown> = {};
  if (typeChanging)                          patch.content_type = nextContentType;
  if (typeChanging || 'platform' in input)   patch.platform     = nextPlatform;
  if (nextTitle !== undefined)               patch.title        = nextTitle;
  if ('body' in input)                       patch.body         = input.body;
  if (nextBrief)                             patch.brief        = nextBrief;

  // Editing user-content on a verified row demotes it back to 'draft' and
  // clears the stale verdict so the UI doesn't keep showing a green tick.
  const touchesContent =
    patch.body !== undefined ||
    patch.title !== undefined ||
    patch.content_type !== undefined ||
    patch.platform !== undefined;
  if (current.status === 'verified' && touchesContent) {
    patch.status       = 'draft';
    patch.verification = {};
  }

  if (Object.keys(patch).length === 0) {
    return err('No fields to update.', 400);
  }

  const { data, error } = await sb
    .from('content_drafts')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return pgError(error);
  return ok({ draft: data });
});

/**
 * DELETE /api/admin/content-creator/[id]?hard=true
 *
 * Two modes:
 *   - default   → soft archive (status = 'archived'). Reversible.
 *   - ?hard=true → permanent row removal. Refused while the edge fn is in
 *     flight (`generating` / `verifying`) so we don't orphan a running
 *     AI chain that then tries to update a ghost row.
 *
 * Both modes also null out the `used_in_draft_id` reference on the source
 * topic (if any) so a topic that had this as its only draft can be reused.
 */
export const DELETE = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id }       = await readParams(ctx);
  const { searchParams } = new URL(req.url);
  const hard         = searchParams.get('hard') === 'true';
  const sb           = adminClient();

  if (hard) {
    const { data: current, error: loadErr } = await sb
      .from('content_drafts')
      .select('id, status')
      .eq('id', id)
      .single();
    if (loadErr) return pgError(loadErr);
    if (current.status === 'generating' || current.status === 'verifying') {
      return err(
        `Cannot delete while status = ${current.status}. Wait for the current stage to finish, then try again.`,
        409,
      );
    }

    // Release any source-topic pointer before removing the row, so the
    // topic becomes reusable for another brief.
    await sb
      .from('content_topics')
      .update({ used_in_draft_id: null, status: 'approved' })
      .eq('used_in_draft_id', id);

    const { error } = await sb.from('content_drafts').delete().eq('id', id);
    if (error) return pgError(error);
    return ok({ ok: true, hard: true });
  }

  // Soft delete = archive. Reversible via a manual status flip in SQL.
  const { error } = await sb
    .from('content_drafts')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) return pgError(error);
  return ok({ ok: true, hard: false });
});
