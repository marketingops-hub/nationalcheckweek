import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { HomepageBlockPatchSchema, parseBody } from '@/lib/adminSchemas';

export const runtime = 'edge';

/**
 * GET /api/admin/homepage-blocks/[id]
 * Get a single homepage block
 */
export const GET = requireAdmin(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  const sb = adminClient();
  const { id } = await context!.params;

  const { data, error } = await sb
    .from('homepage_blocks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ block: data });
});

/**
 * PATCH /api/admin/homepage-blocks/[id]
 * Update a homepage block
 */
export const PATCH = requireAdmin(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  try {
    const sb = adminClient();
    const { id } = await context!.params;
    const raw = await req.json().catch(() => null);
    if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

    const parsed = parseBody(HomepageBlockPatchSchema, raw);
    if (!parsed.ok) return parsed.response;

    const updates = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));

    const { data, error } = await sb
      .from('homepage_blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API PATCH] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API PATCH] Successfully updated block:', data);

    // Force revalidation of homepage cache
    revalidatePath('/');

    return NextResponse.json({ block: data });
  } catch (err) {
    console.error('[API PATCH] Unexpected error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err instanceof Error ? err.stack : String(err)
    }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/homepage-blocks/[id]
 * Delete a homepage block
 */
export const DELETE = requireAdmin(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  const sb = adminClient();
  const { id } = await context!.params;

  const { error } = await sb
    .from('homepage_blocks')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Force revalidation of homepage cache
  revalidatePath('/');

  return NextResponse.json({ success: true });
});
