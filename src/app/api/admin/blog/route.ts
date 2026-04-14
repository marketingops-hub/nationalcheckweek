import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/adminAuth';
import { blogPostCreateSchema, safeValidate } from '@/lib/validation/schemas';

/**
 * GET /api/admin/blog
 * List all blog posts (with optional filter)
 * 
 * Query params:
 * - all: Include drafts (default: published only)
 */

export const GET = async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = adminClient();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';

  let query = sb
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (!all) {
    query = query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
};

/**
 * POST /api/admin/blog
 * Create a new blog post
 * 
 * Request body: See blogPostCreateSchema
 */
export const POST = async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = adminClient();
  
  // Parse and validate request body
  const body = await req.json();
  const validation = safeValidate(blogPostCreateSchema, body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }
  
  const validatedData = validation.data;
  
  // Check slug uniqueness
  const { data: existing } = await sb
    .from('blog_posts')
    .select('id')
    .eq('slug', validatedData.slug)
    .single();
  
  if (existing) {
    return NextResponse.json(
      { error: 'A post with this slug already exists' },
      { status: 409 }
    );
  }

  // Insert blog post
  const { data, error } = await sb
    .from('blog_posts')
    .insert({
      title: validatedData.title,
      slug: validatedData.slug,
      excerpt: validatedData.excerpt || null,
      content: validatedData.content || null,
      feature_image: validatedData.feature_image || null,
      author: validatedData.author || null,
      published: validatedData.published ?? false,
      published_at: validatedData.published ? new Date().toISOString() : null,
      meta_title: validatedData.meta_title || null,
      meta_desc: validatedData.meta_desc || null,
      og_image: validatedData.og_image || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
};
