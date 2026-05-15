import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'edge';

/**
 * GET /api/admin/homepage-blocks
 * Get all homepage blocks (ordered by display_order)
 */
export const GET = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();

  const { data, error } = await sb
    .from('homepage_blocks')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ blocks: data ?? [] });
});

/**
 * POST /api/admin/homepage-blocks
 * Create a new homepage block
 */
export const POST = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const body = await req.json();

  // Get the highest display_order and add 1
  const { data: maxOrder } = await sb
    .from('homepage_blocks')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const newOrder = maxOrder ? maxOrder.display_order + 1 : 1;

  const { data, error } = await sb
    .from('homepage_blocks')
    .insert({
      block_type: body.block_type,
      title: body.title || null,
      content: body.content || {},
      display_order: newOrder,
      is_visible: body.is_visible ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ block: data });
});

/**
 * PATCH /api/admin/homepage-blocks
 * Bulk update block orders (for drag-and-drop)
 */
export const PATCH = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const body = await req.json();
  const { blocks } = body; // Array of { id, display_order }

  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 });
  }

  // Update each block's display_order
  const updates = blocks.map(async (block) => {
    return sb
      .from('homepage_blocks')
      .update({ display_order: block.display_order })
      .eq('id', block.id);
  });

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    return NextResponse.json({ 
      error: 'Some updates failed',
      details: errors.map(e => e.error?.message)
    }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: blocks.length });
});
