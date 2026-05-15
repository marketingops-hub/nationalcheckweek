/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/content-creator/topics/[id]
 *
 * GET    → single topic (for the brief form prefill).
 * PATCH  → approve / archive / light edits (title, angle, keywords, etc.).
 * DELETE → hard delete (use PATCH status='archived' for soft-delete instead).
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { PatchTopicSchema } from '@/lib/content-creator/topics';
import type { ContentTopic } from '@/lib/content-creator/topics';
import {
  ok, err, pgError, parseJsonBody, validate, readParams,
} from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);

  const { data, error } = await adminClient()
    .from('content_topics')
    .select('*')
    .eq('id', id)
    .single<ContentTopic>();

  if (error) return pgError(error);
  if (!data)  return err('Not found', 404);
  return ok({ topic: data });
});

export const PATCH = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);

  const body = await parseJsonBody(req);
  if (body instanceof NextResponse) return body;

  const input = validate(PatchTopicSchema, body);
  if (input instanceof NextResponse) return input;

  if (Object.keys(input).length === 0) return err('No fields to update.', 400);

  const sb = adminClient();

  // Guardrail: once a topic is 'used' it's terminal. Re-approving / re-editing
  // breaks the one-shot semantics. Archive is still allowed so admins can
  // hide used topics from the audit log view.
  if (input.status && input.status !== 'archived') {
    const { data: current } = await sb
      .from('content_topics')
      .select('status')
      .eq('id', id)
      .single<{ status: string }>();
    if (current?.status === 'used') {
      return err(
        `Topic is already 'used' — cannot change status to '${input.status}'.`,
        409,
      );
    }
  }

  const { data, error } = await sb
    .from('content_topics')
    .update(input)
    .eq('id', id)
    .select()
    .single<ContentTopic>();

  if (error) return pgError(error);
  if (!data)  return err('Update failed', 500);
  return ok({ topic: data });
});

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);

  const { error } = await adminClient()
    .from('content_topics')
    .delete()
    .eq('id', id);

  if (error) return pgError(error);
  return ok({ ok: true });
});
