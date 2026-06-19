/* ═══════════════════════════════════════════════════════════════════════════
 * GET /api/admin/seo-report
 *
 * Fetches all published blog posts, events, and CMS pages, runs the
 * SEO + AISEO analyzer on each, and returns the full scored report.
 *
 * Response: { pages: PageReport[], generated_at: string }
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import {
  scoreSeo, scoreAiSeo, extractBlockText,
  type PageReport,
} from '@/lib/seo-analyzer';

export const runtime     = 'nodejs';
export const maxDuration = 30;

export const GET = requireAdmin(async (_req: NextRequest) => {
  const sb = adminClient();
  const pages: PageReport[] = [];

  /* ── Blog posts ─────────────────────────────────────────────────────── */
  const { data: posts } = await sb
    .from('blog_posts')
    .select('id, title, slug, content, excerpt, author, meta_title, meta_desc, og_image, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(100);

  for (const p of (posts ?? [])) {
    const body = (p.content as string) ?? '';
    const seo  = scoreSeo({
      title:       p.title        ?? '',
      slug:        p.slug         ?? '',
      metaTitle:   p.meta_title   ?? '',
      metaDesc:    p.meta_desc    ?? '',
      ogImage:     p.og_image     ?? '',
      bodyText:    body,
      excerpt:     p.excerpt      ?? '',
      hasAuthor:   Boolean(p.author),
      publishDate: p.published_at ?? null,
      type:        'blog',
    });
    const ai = scoreAiSeo({
      title:       p.title     ?? '',
      bodyText:    body,
      hasAuthor:   Boolean(p.author),
      publishDate: p.published_at ?? null,
      type:        'blog',
    });
    pages.push({
      id:        p.id,
      type:      'blog',
      title:     p.title    ?? '(untitled)',
      slug:      p.slug     ?? '',
      url:       `/blog/${p.slug}`,
      editUrl:   `/admin/blog/${p.id}/edit`,
      seoScore:  seo.score,
      aiScore:   ai.score,
      seoChecks: seo.checks,
      aiChecks:  ai.checks,
    });
  }

  /* ── Events ─────────────────────────────────────────────────────────── */
  const { data: events } = await sb
    .from('events')
    .select('id, title, slug, description, body, feature_image, seo_title, seo_desc, event_date, published')
    .eq('published', true)
    .order('event_date', { ascending: false })
    .limit(100);

  for (const e of (events ?? [])) {
    const body = [(e.description as string) ?? '', (e.body as string) ?? ''].join('\n');
    const seo  = scoreSeo({
      title:       e.title       ?? '',
      slug:        e.slug        ?? '',
      metaTitle:   e.seo_title   ?? '',
      metaDesc:    e.seo_desc    ?? '',
      ogImage:     e.feature_image ?? '',
      bodyText:    body,
      excerpt:     e.description ?? '',
      hasAuthor:   false,
      publishDate: e.event_date  ?? null,
      type:        'event',
    });
    const ai = scoreAiSeo({
      title:       e.title ?? '',
      bodyText:    body,
      hasAuthor:   false,
      publishDate: e.event_date ?? null,
      type:        'event',
    });
    pages.push({
      id:        e.id,
      type:      'event',
      title:     e.title    ?? '(untitled)',
      slug:      e.slug     ?? '',
      url:       `/events/${e.slug}`,
      editUrl:   `/admin/events/${e.id}/edit`,
      seoScore:  seo.score,
      aiScore:   ai.score,
      seoChecks: seo.checks,
      aiChecks:  ai.checks,
    });
  }

  /* ── CMS Pages ──────────────────────────────────────────────────────── */
  const { data: cmsPages } = await sb
    .from('pages')
    .select('id, title, slug, description, content, meta_title, meta_desc, og_image, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(100);

  for (const p of (cmsPages ?? [])) {
    const bodyText = extractBlockText(p.content) + '\n' + ((p.description as string) ?? '');
    const seo = scoreSeo({
      title:       p.title      ?? '',
      slug:        p.slug       ?? '',
      metaTitle:   p.meta_title ?? '',
      metaDesc:    p.meta_desc  ?? '',
      ogImage:     p.og_image   ?? '',
      bodyText,
      excerpt:     p.description ?? '',
      hasAuthor:   false,
      publishDate: p.updated_at ?? null,
      type:        'page',
    });
    const ai = scoreAiSeo({
      title:       p.title ?? '',
      bodyText,
      hasAuthor:   false,
      publishDate: p.updated_at ?? null,
      type:        'page',
    });
    pages.push({
      id:        p.id,
      type:      'page',
      title:     p.title    ?? '(untitled)',
      slug:      p.slug     ?? '',
      url:       `/${p.slug}`,
      editUrl:   `/admin/cms/pages/${p.id}/edit`,
      seoScore:  seo.score,
      aiScore:   ai.score,
      seoChecks: seo.checks,
      aiChecks:  ai.checks,
    });
  }

  return NextResponse.json({ pages, generated_at: new Date().toISOString() });
});
