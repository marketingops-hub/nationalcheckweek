/**
 * GET /api/admin/issues
 *
 * Admin-side list of every row in public.issues. Uses the service-role
 * client so RLS can't suppress rows that are visible to the admin UI at
 * /admin/issues (which reads the table server-side). Mirrors the shape
 * the admin page already consumes — camelCased derived fields aren't
 * needed here; the GEO dropdown only reads { slug, title, severity }.
 */

import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb
    .from('issues')
    .select('id, rank, slug, title, severity, icon, anchor_stat')
    .order('rank', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ issues: data ?? [] });
});
