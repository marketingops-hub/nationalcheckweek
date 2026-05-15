import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { AmbassadorCategoryPostSchema, parseBody } from '@/lib/adminSchemas';

export const runtime = 'edge';

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb
    .from('ambassador_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
});

export const POST = requireAdmin(async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(AmbassadorCategoryPostSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  const { data, error } = await sb
    .from('ambassador_categories')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
});
