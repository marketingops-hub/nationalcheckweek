/* ═══════════════════════════════════════════════════════════════════════════
 * Shared helpers for the publish-to-blog / publish-to-pages routes.
 *
 * Both endpoints take a finalized draft and upsert it into a CMS table
 * (`blog_posts` or `pages`). They previously carried verbatim copies of the
 * slug + excerpt logic; this module is the single source of truth so a fix
 * to collision handling or excerpt derivation lands in one place.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { adminClient } from '@/lib/adminClient';

type Sb = ReturnType<typeof adminClient>;

/** Turn an arbitrary title into a kebab-case, URL-safe slug (a-z0-9-),
 *  capped at 100 chars. Falls back to 'untitled' for empty input. */
export function slugify(title: string): string {
  return (title ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')   // strip combining accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    || 'untitled';
}

/** Find an unused slug in `table`. If `base` is free, returns it unchanged;
 *  otherwise appends `-2`, `-3`, … until one is free, giving up at 50 with a
 *  timestamp suffix (practically unique) rather than throwing. `excludeId`
 *  skips the row we're about to update so a re-publish doesn't fight itself
 *  for its own slug. */
export async function reserveSlug(
  sb: Sb,
  table: 'blog_posts' | 'pages',
  base: string,
  excludeId: string | null,
): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    let q = sb.from(table).select('id').eq('slug', candidate).limit(1);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q;
    if (!data || data.length === 0) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** First non-empty paragraph, markdown-stripped, capped at 300 chars.
 *  `skipHeadings` (used by the pages route) also skips paragraphs that are
 *  wholly a bold heading line (`**Section**`) so the excerpt is real prose. */
export function deriveExcerpt(body: string, opts: { skipHeadings?: boolean } = {}): string {
  const firstPara = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .find((p) =>
      p.length > 0 &&
      !p.startsWith('---') &&
      (!opts.skipHeadings || !/^\*\*.+\*\*$/.test(p)),
    );
  if (!firstPara) return '';
  return firstPara
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // bold
    .replace(/[_*`~]/g, '')
    .slice(0, 300)
    .trim();
}
