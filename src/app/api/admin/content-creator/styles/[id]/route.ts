/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/content-creator/styles/[id]
 *
 * GET    → fetch one style
 * PATCH  → edit title / description / prompt / is_active / sort_order
 * DELETE → hard delete
 *
 * Hard delete is intentional (no archive). Styles are cheap and fully
 * user-managed. Any content_drafts already generated with a now-deleted
 * style keep working — the edge fns treat a missing style_id as "no style
 * prompt".
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { PatchStyleSchema } from '@/lib/content-creator/styles';
import {
  ok, err, pgError, parseJsonBody, validate, readParams,
} from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);

  const { data, error } = await adminClient()
    .from('content_writing_styles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return pgError(error);
  return ok({ style: data });
});

export const PATCH = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);

  const body = await parseJsonBody(req);
  if (body instanceof NextResponse) return body;

  const input = validate(PatchStyleSchema, body);
  if (input instanceof NextResponse) return input;

  // Empty body is a schema-level success (PatchStyleSchema is all-optional)
  // but semantically an error: nothing to update. Reject so the UI can
  // show a targeted "pick at least one field" message.
  if (Object.keys(input).length === 0) return err('No fields to update.', 400);

  const { data, error } = await adminClient()
    .from('content_writing_styles')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) return pgError(error);
  return ok({ style: data });
});

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);

  const { error } = await adminClient()
    .from('content_writing_styles')
    .delete()
    .eq('id', id);

  if (error) return pgError(error);
  return ok({ ok: true });
});
