/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/approve
 *
 * Transitions a draft from 'idea' → 'approved_idea'. Cheap, no AI calls.
 * Separate route so the UI can approve ideas in bulk without touching the
 * generate endpoint (which is rate-limited).
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { canTransition } from '@/lib/content-creator/schemas';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();

  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status')
    .eq('id', id)
    .single();
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 404 });

  if (!canTransition(current.status, 'approved_idea')) {
    return NextResponse.json(
      { error: `Cannot approve from status '${current.status}'.` },
      { status: 409 },
    );
  }

  const { data, error } = await sb
    .from('content_drafts')
    .update({ status: 'approved_idea' })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: data });
});
