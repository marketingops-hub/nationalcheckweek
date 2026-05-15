import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'edge';

/**
 * GET /api/admin/areas
 * List all areas with authentication
 */
export const GET = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  
  const { data, error } = await sb
    .from('areas')
    .select('id, slug, name, state, type, issues, updated_at, seo_title')
    .order('state')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ areas: data ?? [] });
});

/**
 * POST /api/admin/areas
 * Create a new area
 */
export const POST = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const body = await req.json();

  const { data, error } = await sb
    .from('areas')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ area: data });
});
