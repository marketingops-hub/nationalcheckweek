import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'edge';

/**
 * Whitelist of columns a client may set when creating an area. Prevents
 * mass-assignment: without this, `insert(body)` would write any column the
 * caller chose to include (id, created_at, future sensitive columns).
 * Mirrors the fields the Area edit form and bulk importer actually send.
 */
const CreateAreaSchema = z.object({
  name:        z.string().trim().min(1).max(200),
  state:       z.string().trim().min(1).max(100),
  state_slug:  z.string().trim().min(1).max(120),
  slug:        z.string().trim().min(1).max(200),
  type:        z.enum(['city', 'region', 'lga']).default('city'),
  population:  z.string().trim().max(50).optional(),
  schools:     z.string().trim().max(50).optional(),
  overview:    z.string().max(20_000).optional(),
  prevention:  z.string().max(20_000).optional(),
  key_stats:   z.array(z.unknown()).max(50).optional(),
  issues:      z.array(z.unknown()).max(100).optional(),
  seo_title:   z.string().trim().max(300).optional(),
  seo_desc:    z.string().trim().max(500).optional(),
  og_image:    z.string().trim().max(1000).optional(),
}).strict();

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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = CreateAreaSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await sb
    .from('areas')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    // Log the raw DB error server-side; return a generic message so we
    // don't leak schema/constraint details to the client.
    console.error('[areas:create] insert failed:', error.message);
    return NextResponse.json({ error: 'Failed to create area.' }, { status: 500 });
  }

  return NextResponse.json({ area: data });
});
