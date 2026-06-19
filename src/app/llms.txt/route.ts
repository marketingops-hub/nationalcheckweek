/* ═══════════════════════════════════════════════════════════════════════════
 * GET /llms.txt
 *
 * Dynamic manifest for AI crawlers — the "robots.txt for LLMs".
 * Follows the llmstxt.org spec: a Markdown document listing the site's
 * most important pages with one-line descriptions.
 *
 * Sections:
 *   Site identity & brand facts
 *   Core pages
 *   Wellbeing issues
 *   Blog posts  (last 30 published)
 *   Events      (upcoming + recent)
 *   Areas       (key GEO pages, top 50)
 *   Excluded pages note
 *
 * Response: text/plain, cache 1 hour at edge.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';

export const runtime     = 'nodejs';
export const revalidate  = 3600; // 1 hour

const BASE = 'https://nationalcheckinweek.com';

export async function GET() {
  const sb   = adminClient();
  const now  = new Date().toISOString().slice(0, 10);

  /* ── Fetch all content in parallel ── */
  const [
    { data: settings },
    { data: posts },
    { data: events },
    { data: issues },
    { data: areas },
    { data: cmsPages },
  ] = await Promise.all([
    sb.from('site_settings').select('key,value').in('key', ['site_name','site_description','contact_email']).limit(10),
    sb.from('blog_posts').select('title,slug,excerpt,published_at').eq('published', true).order('published_at', { ascending: false }).limit(30),
    sb.from('events').select('title,slug,description,event_date').eq('published', true).order('event_date', { ascending: false }).limit(30),
    sb.from('issues').select('title,slug,anchor_stat').order('rank').limit(60),
    sb.from('areas').select('name,slug,state').order('name').limit(50),
    sb.from('pages').select('title,slug,description').eq('status', 'published').not('slug', 'in', '("privacy-policy","terms")').limit(20),
  ]);

  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]));
  const siteName    = settingsMap['site_name']        ?? 'National Check-in Week';
  const siteDesc    = settingsMap['site_description'] ?? 'Australia\'s national wellbeing check-in program for young people in schools.';

  /* ── Build the manifest ── */
  const lines: string[] = [];

  // Header
  lines.push(`# ${siteName}`);
  lines.push('');
  lines.push(`> ${siteDesc}`);
  lines.push('');
  lines.push(`> This file was generated on ${now} for AI crawlers and language model indexing.`);
  lines.push(`> Full site: ${BASE}`);
  lines.push(`> Markdown versions of any page: ${BASE}/api/llms-md?path=/blog/example-post`);
  lines.push('');

  // Brand facts block
  lines.push('## About National Check-in Week');
  lines.push('');
  lines.push('National Check-in Week (NCW) is an annual Australian mental health initiative run by LifeSkills Group.');
  lines.push('It encourages schools, communities, and organisations to prioritise youth wellbeing through structured check-ins.');
  lines.push('The program focuses on 59+ identified wellbeing issues affecting young Australians aged 12–25.');
  lines.push('Key partners include government education departments, beyondblue, headspace, and Reach Out.');
  if (settingsMap['contact_email']) {
    lines.push(`Contact: ${settingsMap['contact_email']}`);
  }
  lines.push('');

  // Core pages
  lines.push('## Core Pages');
  lines.push('');
  lines.push(`- [Home](${BASE}/): National Check-in Week program overview and registration`);
  lines.push(`- [Events](${BASE}/events): Webinars, workshops, and live sessions`);
  lines.push(`- [FAQ](${BASE}/faq): Frequently asked questions about the program`);
  lines.push(`- [Partners](${BASE}/partners): Partner organisations and sponsors`);
  lines.push(`- [Resources](${BASE}/resources): Downloadable guides, fact sheets, and toolkits`);
  if (cmsPages?.length) {
    for (const p of cmsPages) {
      const desc = (p.description as string)?.slice(0, 120) ?? '';
      lines.push(`- [${p.title}](${BASE}/${p.slug})${desc ? `: ${desc}` : ''}`);
    }
  }
  lines.push('');

  // Blog posts
  if (posts?.length) {
    lines.push('## Blog & Articles');
    lines.push('');
    for (const p of posts) {
      const excerpt = (p.excerpt as string)?.replace(/\n/g, ' ').slice(0, 120) ?? '';
      const date    = p.published_at ? ` (${(p.published_at as string).slice(0, 10)})` : '';
      lines.push(`- [${p.title}](${BASE}/blog/${p.slug})${date}${excerpt ? `: ${excerpt}` : ''}`);
    }
    lines.push('');
  }

  // Events
  if (events?.length) {
    lines.push('## Events & Webinars');
    lines.push('');
    for (const e of events) {
      const desc = (e.description as string)?.replace(/\n/g, ' ').slice(0, 100) ?? '';
      const date = e.event_date ? ` — ${(e.event_date as string).slice(0, 10)}` : '';
      lines.push(`- [${e.title}](${BASE}/events/${e.slug})${date}${desc ? `: ${desc}` : ''}`);
    }
    lines.push('');
  }

  // Wellbeing issues
  if (issues?.length) {
    lines.push('## Wellbeing Issues');
    lines.push('');
    lines.push('> Each issue page contains Australian statistics, research citations, and school resources.');
    lines.push('');
    for (const i of issues) {
      const excerpt = (i.anchor_stat as string)?.replace(/\n/g, ' ').slice(0, 100) ?? '';
      lines.push(`- [${i.title}](${BASE}/issues/${i.slug})${excerpt ? `: ${excerpt}` : ''}`);
    }
    lines.push('');
  }

  // GEO area pages (sample)
  if (areas?.length) {
    lines.push('## Local Area Pages');
    lines.push('');
    lines.push('> Localised wellbeing data and resources by Australian city, region, and LGA.');
    lines.push('');
    for (const a of areas) {
      const state = a.state ? `, ${a.state}` : '';
      lines.push(`- [${a.name}${state}](${BASE}/areas/${a.slug})`);
    }
    lines.push('');
  }

  // Exclusions note
  lines.push('## Indexing Notes');
  lines.push('');
  lines.push('- All pages listed above are publicly accessible and may be indexed by AI crawlers.');
  lines.push('- Draft and unpublished content is excluded from this manifest.');
  lines.push('- Admin pages (/admin/*) are excluded — require authentication.');
  lines.push('- For clean Markdown of any listed page: GET /api/llms-md?path=<relative-path>');
  lines.push(`- Sitemap: ${BASE}/sitemap.xml`);
  lines.push(`- Robots: ${BASE}/robots.txt`);
  lines.push('');

  const body = lines.join('\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
