/**
 * Homepage Blocks API Routes
 * 
 * Provides CRUD operations for managing homepage content blocks.
 * All routes require admin authentication via requireAdmin middleware.
 * 
 * @module api/admin/homepage-blocks
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/adminAuth';
import type { 
  GetBlocksResponse, 
  CreateBlockRequest, 
  BulkUpdateOrderRequest,
  BlockType,
} from '@/types/homepage-blocks';

/**
 * GET /api/admin/homepage-blocks
 * 
 * Retrieves all homepage blocks ordered by display_order.
 * 
 * @returns {GetBlocksResponse} Array of homepage blocks
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/homepage-blocks');
 * const { blocks } = await response.json();
 * ```
 */
export const GET = async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = adminClient();

  try {
    const { data, error } = await sb
      .from('homepage_blocks')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[API] Failed to fetch homepage blocks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch homepage blocks', details: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { blocks: data ?? [] },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[API] Unexpected error fetching blocks:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

/**
 * POST /api/admin/homepage-blocks
 * 
 * Creates a new homepage block.
 * Automatically assigns the next available display_order.
 * 
 * @param {CreateBlockRequest} body - Block creation data
 * @returns {Object} Created block data
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/homepage-blocks', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     block_type: 'hero',
 *     title: 'New Hero Block',
 *     content: { heading: 'Welcome', subheading: 'To our site' },
 *     is_visible: true
 *   })
 * });
 * ```
 */
export const POST = async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = adminClient();
  
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.block_type || typeof body.block_type !== 'string') {
      return NextResponse.json(
        { error: 'block_type is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'title is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'object') {
      return NextResponse.json(
        { error: 'content is required and must be an object' },
        { status: 400 }
      );
    }

    // Validate block_type is one of the allowed types
    const validBlockTypes: BlockType[] = [
      'hero', 'stats', 'features', 'logos', 'cta', 'testimonials', 'faq', 'contact',
      'welcome', 'what_is_it', 'why_matters', 'what_makes_different', 'what_and_who',
      'be_part_cta', 'how_to_participate', 'ambassadors', 'how_lifeskills_go',
      'ambassador_voices', 'partners_slideshow', 'if_not_now_when',
    ];
    if (!(validBlockTypes as string[]).includes(body.block_type)) {
      return NextResponse.json(
        { error: `block_type must be one of: ${validBlockTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the highest display_order and add 1
    const { data: maxOrder } = await sb
      .from('homepage_blocks')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newOrder = maxOrder ? maxOrder.display_order + 1 : 1;

    const { data, error } = await sb
      .from('homepage_blocks')
      .insert({
        block_type: body.block_type,
        title: body.title,
        content: body.content,
        display_order: newOrder,
        is_visible: body.is_visible ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Failed to create block:', error);
      return NextResponse.json(
        { error: 'Failed to create block', details: error.message },
        { status: 500 }
      );
    }

    // Force revalidation of homepage cache
    revalidatePath('/');

    return NextResponse.json({ block: data }, { status: 201 });
  } catch (err) {
    console.error('[API] Unexpected error creating block:', err);
    
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

/**
 * PATCH /api/admin/homepage-blocks
 * 
 * Bulk updates display_order for multiple blocks.
 * Used for drag-and-drop reordering.
 * 
 * @param {BulkUpdateOrderRequest} body - Array of block IDs and new orders
 * @returns {Object} Success status and count of updated blocks
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/homepage-blocks', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     blocks: [
 *       { id: 'uuid-1', display_order: 1 },
 *       { id: 'uuid-2', display_order: 2 }
 *     ]
 *   })
 * });
 * ```
 */
export const PATCH = async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = adminClient();
  
  try {
    const body = await req.json();
    const { blocks } = body;

    // Validate input
    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'blocks must be an array' },
        { status: 400 }
      );
    }

    if (blocks.length === 0) {
      return NextResponse.json(
        { error: 'blocks array cannot be empty' },
        { status: 400 }
      );
    }

    // Validate each block has required fields
    for (const block of blocks) {
      if (!block.id || typeof block.id !== 'string') {
        return NextResponse.json(
          { error: 'Each block must have a valid id (string)' },
          { status: 400 }
        );
      }
      if (typeof block.display_order !== 'number' || block.display_order < 1) {
        return NextResponse.json(
          { error: 'Each block must have a valid display_order (number >= 1)' },
          { status: 400 }
        );
      }
    }

    // Rate limiting: max 100 blocks at once
    if (blocks.length > 100) {
      return NextResponse.json(
        { error: 'Cannot update more than 100 blocks at once' },
        { status: 400 }
      );
    }

    // Update each block's display_order
    const updates = blocks.map(async (block) => {
      return sb
        .from('homepage_blocks')
        .update({ 
          display_order: block.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', block.id);
    });

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      console.error('[API] Some block updates failed:', errors);
      return NextResponse.json({ 
        error: 'Some updates failed',
        details: errors.map(e => e.error?.message),
        failedCount: errors.length,
        successCount: results.length - errors.length
      }, { status: 207 }); // 207 Multi-Status for partial success
    }

    // Force revalidation of homepage cache
    revalidatePath('/');

    return NextResponse.json({ 
      success: true, 
      updated: blocks.length 
    });
  } catch (err) {
    console.error('[API] Unexpected error updating blocks:', err);
    
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
