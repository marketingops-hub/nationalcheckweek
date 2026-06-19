/* ═══════════════════════════════════════════════════════════════════════════
 * GET /api/llms-md?path=/blog/some-post
 *
 * Serves any published page as clean Markdown for AI/LLM consumers.
 * Called by middleware for known AI bots, and available publicly for
 * programmatic access (e.g. Perplexity deep-links here).
 *
 * Supported paths:
 *   /blog/<slug>          → blog_posts
 *   /events/<slug>        → events
 *   /issues/<slug>        → issues
 *   /<slug>               → pages (CMS)
 *   /areas/<slug>         → content (areas)
 *
 * Returns 404 for unpublished / non-existent content.
 * Sets X-LLM-Source header so the middleware can detect circular rewrites.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { anyToMarkdown } from '@/lib/to-markdown';

export const runtime    = 'nodejs';
export const revalidate = 300; // 5 minutes

const BASE = 'https://nationalcheckinweek.com';

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') ?? '';
  if (!path || path === '/') return notFound('Provide a ?path= parameter');

  const sb      = adminClient();
  const segs    = path.replace(/^\//, '').split('/');
  const section = segs[0];
  const slug    = segs[1] ?? segs[0];

  let md: string | null = null;

  /* ── Blog posts ── */
  if (section === 'blog' && slug) {
    const { data } = await sb.from('blog_posts')
      .select('title,slug,excerpt,content,author,published_at,meta_desc')
      .eq('slug', slug).eq('published', true).single();
    if (data) {
      const header = [
        `# ${data.title ?? ''}`,
        data.author ? `**Author:** ${data.author}` : '',
        data.published_at ? `**Published:** ${(data.published_at as string).slice(0, 10)}` : '',
        data.meta_desc ? `\n> ${data.meta_desc}` : '',
        data.excerpt && data.excerpt !== data.meta_desc ? `\n${data.excerpt}` : '',
      ].filter(Boolean).join('\n');
      md = `${header}\n\n---\n\n${anyToMarkdown(data.content)}`;
    }
  }

  /* ── Events ── */
  else if (section === 'events' && slug) {
    const { data } = await sb.from('events')
      .select('title,slug,description,body,event_date,seo_desc')
      .eq('slug', slug).eq('published', true).single();
    if (data) {
      const date = data.event_date ? `\n**Date:** ${(data.event_date as string).slice(0, 10)}` : '';
      const desc = (data.seo_desc ?? data.description) as string ?? '';
      md = [
        `# ${data.title ?? ''}`,
        date,
        desc ? `\n> ${desc}` : '',
        '\n---\n',
        anyToMarkdown(data.description as string),
        anyToMarkdown(data.body as string),
      ].filter(Boolean).join('\n');
    }
  }

  /* ── Wellbeing issues ── */
  else if (section === 'issues' && slug) {
    const { data } = await sb.from('issues')
      .select('title,slug,excerpt,content,meta_desc')
      .eq('slug', slug).single();
    if (data) {
      md = [
        `# ${data.title ?? ''}`,
        data.meta_desc ? `\n> ${data.meta_desc}` : '',
        '\n---\n',
        anyToMarkdown(data.content, data.excerpt as string),
      ].filter(Boolean).join('\n');
    }
  }

  /* ── Area / GEO pages ── */
  else if (section === 'areas' && slug) {
    const { data } = await sb.from('content')
      .select('name,slug,state,description,seo_title,seo_desc')
      .eq('slug', slug).single();
    if (data) {
      md = [
        `# ${data.name ?? ''}${data.state ? `, ${data.state}` : ''}`,
        data.seo_desc ? `\n> ${data.seo_desc}` : '',
        '\n---\n',
        data.description ? anyToMarkdown(data.description as string) : '',
      ].filter(Boolean).join('\n');
    }
  }

  /* ── CMS static pages ── */
  else if (segs.length === 1 || section === 'pages') {
    const pageSlug = segs.length === 1 ? segs[0] : slug;
    const { data } = await sb.from('pages')
      .select('title,slug,description,content,meta_desc')
      .eq('slug', pageSlug).eq('status', 'published').single();
    if (data) {
      md = [
        `# ${data.title ?? ''}`,
        (data.meta_desc ?? data.description) ? `\n> ${data.meta_desc ?? data.description}` : '',
        '\n---\n',
        anyToMarkdown(data.content, data.description as string),
      ].filter(Boolean).join('\n');
    }
  }

  if (!md) return notFound(`No published content found for path: ${path}`);

  // Append source footer for citation purposes
  const footer = `\n\n---\n_Source: [${BASE}${path}](${BASE}${path}) — National Check-in Week_`;

  return new NextResponse(md + footer, {
    headers: {
      'Content-Type':  'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-LLM-Source':  '1',
      'X-Robots-Tag':  'noindex', // don't index the MD mirror itself
    },
  });
}

function notFound(msg: string) {
  return new NextResponse(`# 404 Not Found\n\n${msg}`, {
    status: 404,
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
