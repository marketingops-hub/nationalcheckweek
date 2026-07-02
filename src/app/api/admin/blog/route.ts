import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff } from '@/lib/auth';
import { blogPostCreateSchema, safeValidate } from '@/lib/adminSchemas';
import { revalidateEntity } from '@/lib/revalidate';

/**
 * GET /api/admin/blog
 * List all blog posts (with optional filter)
 * 
 * Query params:
 * - all: Include drafts (default: published only)
 */

export const GET = requireStaff(async (req: NextRequest) => {
  const sb = adminClient();
  const { searchParams } = new URL(req.url);
  const all    = searchParams.get('all') === 'true';
  const limit  = Math.min(Math.max(parseInt(searchParams.get('limit')  ?? '50', 10), 1), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0);

  let query = sb
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!all) {
    query = query.eq('published', true);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[blog:list]', error.message);
    return NextResponse.json({ error: 'Failed to fetch posts.' }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [], total: count ?? 0 });
});

/**
 * POST /api/admin/blog
 * Create a new blog post
 * 
 * Request body: See blogPostCreateSchema
 */
export const POST = requireStaff(async (req: NextRequest) => {
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
      // Approval gate: new posts always start unpublished, in 'draft' review
      // state. Publishing only happens through the submit → approve flow.
      published: false,
      published_at: null,
      review_status: 'draft',
      meta_title: validatedData.meta_title || null,
      meta_desc: validatedData.meta_desc || null,
      og_image: validatedData.og_image || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[blog:create]', error.message);
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 });
  }

  revalidateEntity('blog', data.slug);
  return NextResponse.json({ post: data });
});
