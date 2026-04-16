import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { BlogPatchSchema, parseBody } from '@/lib/adminSchemas';

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { data, error } = await sb.from('blog_posts').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json({ post: data });
});

export const PATCH = requireAdmin(async (req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(BlogPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const patch = { ...parsed.data, updated_at: new Date().toISOString() } as Record<string, unknown>;
  if (parsed.data.published && !parsed.data.published_at) {
    patch.published_at = new Date().toISOString();
  }

  const sb = adminClient();
  const { data, error } = await sb.from('blog_posts').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
});

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
});
