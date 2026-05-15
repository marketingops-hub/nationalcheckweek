/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/content-creator/topics
 *
 * GET  → list topics, filterable by status + vault_category.
 * POST is NOT here — generation lives at /topics/generate so the simple GET
 *       list doesn't share a rate-limiter with the expensive AI call.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export const GET = requireAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const category = searchParams.get('vault_category');
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);

  const sb = adminClient();
  let q = sb
    .from('content_topics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status)   q = q.eq('status', status);
  if (category) q = q.eq('vault_category', category);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topics: data ?? [] });
});
