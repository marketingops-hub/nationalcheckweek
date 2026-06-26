/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/seo-optimize   → analyse + generate patches
 * PATCH /api/admin/seo-optimize  → apply accepted patches to the DB
 *
 * Flow:
 *  1. Fetch the page from Supabase
 *  2. Run scoreAiSeo to identify failing checks
 *  3. Pull relevant Vault context (pgvector search on page title)
 *  4. Ask Claude to produce a JSON array of field-level patches that fix
 *     every failing check (body rewrite + title/meta field rewrites)
 *  5. Estimate the post-patch AISEO score and return everything
 *
 * PATCH writes the accepted subset of patches back to the DB.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { AnthropicService } from '@/lib/ai/anthropic-service';
import { fetchVaultContext, formatVaultContext } from '@/lib/content-creator/vault';
import {
  scoreSeo, scoreAiSeo, extractBlockText,
  type PageReport, type SeoCheck,
} from '@/lib/seo-analyzer';

export const runtime     = 'nodejs';
export const maxDuration = 120;

/* ─── Shared types (imported by the UI page) ─────────────────────────────── */

export interface OptimizePatch {
  check_keys:  string[];   // AISEO/SEO check keys this patch addresses
  field:       string;     // 'body' | 'title' | 'meta_title' | 'meta_desc' | 'excerpt'
  field_label: string;
  original:    string;
  optimized:   string;
  explanation: string;
}

export interface OptimizeResult {
  page:            PageReport;
  patches:         OptimizePatch[];
  vault_refs:      Array<{ id: string; title: string; source: string }>;
  ai_score_before: number;
  ai_score_after:  number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function failingKeys(checks: SeoCheck[]): string[] {
  return checks.filter(c => c.status !== 'pass').map(c => c.key);
}

function tryParseJson<T>(raw: string): T | null {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  // grab first {...} or [{...}] block
  const m = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  try { return JSON.parse(m ? m[0] : stripped) as T; }
  catch { return null; }
}

/* ─── Fetch raw page record ──────────────────────────────────────────────── */

interface RawPage {
  id:          string;
  type:        'blog' | 'event' | 'page';
  title:       string;
  slug:        string;
  body:        string;
  excerpt:     string;
  author:      string;
  metaTitle:   string;
  metaDesc:    string;
  ogImage:     string;
  publishDate: string | null;
}

async function fetchPage(
  sb: ReturnType<typeof adminClient>,
  id: string,
  type: string,
): Promise<RawPage | null> {
  if (type === 'blog') {
    const { data } = await sb.from('blog_posts')
      .select('id,title,slug,content,excerpt,author,meta_title,meta_desc,og_image,published_at')
      .eq('id', id).single();
    if (!data) return null;
    return {
      id: data.id, type: 'blog',
      title: data.title ?? '', slug: data.slug ?? '',
      body: (data.content as string) ?? '',
      excerpt: data.excerpt ?? '', author: data.author ?? '',
      metaTitle: data.meta_title ?? '', metaDesc: data.meta_desc ?? '',
      ogImage: data.og_image ?? '', publishDate: data.published_at ?? null,
    };
  }
  if (type === 'event') {
    const { data } = await sb.from('events')
      .select('id,title,slug,description,body,feature_image,seo_title,seo_desc,event_date')
      .eq('id', id).single();
    if (!data) return null;
    return {
      id: data.id, type: 'event',
      title: data.title ?? '', slug: data.slug ?? '',
      // Use body column only for optimization target — description is the excerpt field
      body: (data.body as string) ?? (data.description as string) ?? '',
      excerpt: (data.description as string) ?? '',
      author: '', metaTitle: data.seo_title ?? '', metaDesc: data.seo_desc ?? '',
      ogImage: data.feature_image ?? '', publishDate: data.event_date ?? null,
    };
  }
  if (type === 'page') {
    const { data } = await sb.from('pages')
      .select('id,title,slug,description,content,meta_title,meta_desc,og_image,updated_at')
      .eq('id', id).single();
    if (!data) return null;
    const body = extractBlockText(data.content) + '\n' + ((data.description as string) ?? '');
    return {
      id: data.id, type: 'page',
      title: data.title ?? '', slug: data.slug ?? '',
      body: body.trim(), excerpt: (data.description as string) ?? '',
      author: '', metaTitle: data.meta_title ?? '', metaDesc: data.meta_desc ?? '',
      ogImage: data.og_image ?? '', publishDate: data.updated_at ?? null,
    };
  }
  return null;
}

function buildScores(p: RawPage) {
  const seo = scoreSeo({
    title: p.title, slug: p.slug,
    metaTitle: p.metaTitle, metaDesc: p.metaDesc,
    ogImage: p.ogImage, bodyText: p.body,
    excerpt: p.excerpt, hasAuthor: Boolean(p.author),
    publishDate: p.publishDate, type: p.type,
  });
  const ai = scoreAiSeo({
    title: p.title, bodyText: p.body,
    hasAuthor: Boolean(p.author), publishDate: p.publishDate,
    type: p.type,
  });
  return { seo, ai };
}

function toPageReport(p: RawPage, seo: ReturnType<typeof scoreSeo>, ai: ReturnType<typeof scoreAiSeo>): PageReport {
  return {
    id: p.id, type: p.type, title: p.title, slug: p.slug,
    url:     p.type === 'blog'  ? `/blog/${p.slug}` : p.type === 'event' ? `/events/${p.slug}` : `/${p.slug}`,
    editUrl: p.type === 'blog'  ? `/admin/blog/${p.id}/edit`
           : p.type === 'event' ? `/admin/events/${p.id}/edit`
           : `/admin/cms/pages/${p.id}/edit`,
    seoScore: seo.score, aiScore: ai.score,
    seoChecks: seo.checks, aiChecks: ai.checks,
  };
}

/* ─── POST — generate patches ────────────────────────────────────────────── */

export const POST = requireStaff(async (req: NextRequest) => {
  const body = await req.json() as { id: string; type: string };
  if (!body.id || !body.type) {
    return NextResponse.json({ error: 'id and type required' }, { status: 400 });
  }

  const sb   = adminClient();
  const page = await fetchPage(sb, body.id, body.type);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { seo, ai } = buildScores(page);
  const pageReport  = toPageReport(page, seo, ai);

  const failingAi  = failingKeys(ai.checks);
  const failingSeo = failingKeys(seo.checks);

  // Checks that can be fixed per field
  const bodyChecks     = failingAi.filter(k => ['facts','structure','depth','entity','proper_nouns','faq','sources'].includes(k));
  const needTitle      = failingAi.includes('title_specific');
  const needMetaTitle  = failingSeo.includes('meta_title');
  const needMetaDesc   = failingSeo.includes('meta_desc');
  const needExcerpt    = failingSeo.includes('excerpt');
  const authorNote     = failingAi.includes('author') && page.type === 'blog';

  const anythingToFix  = bodyChecks.length > 0 || needTitle || needMetaTitle || needMetaDesc || needExcerpt;

  if (!anythingToFix) {
    return NextResponse.json({
      page: pageReport, patches: [], vault_refs: [],
      ai_score_before: ai.score, ai_score_after: ai.score,
    } satisfies OptimizeResult);
  }

  // Pull vault context keyed to the page topic
  const vaultEntries = await fetchVaultContext({ topic: page.title, limit: 10 });
  const vaultText    = formatVaultContext(vaultEntries);
  const vaultRefs    = vaultEntries.slice(0, 6).map(e => ({ id: e.id, title: e.title ?? '', source: e.source ?? '' }));

  // Check descriptions for the prompt
  const CHECK_DESC: Record<string, string> = {
    facts:        'Inject specific statistics and numerical data from the Vault context',
    structure:    'Add ## section headings to break the body into scannable sections',
    depth:        'Expand underdeveloped sections with relevant vault-sourced detail',
    entity:       'Explicitly name the organisation (National Check-in Week / LifeSkills Group)',
    proper_nouns: 'Introduce specific named people, organisations, programs, or places',
    faq:          'Append a "## Frequently Asked Questions" section with 3–4 Q: A: pairs',
    sources:      'Add [Source N] citations after statistics; append a "## Sources" list',
  };

  const bodyCheckLines = bodyChecks.map(k => `  - ${k}: ${CHECK_DESC[k]}`).join('\n');

  const systemPrompt = `You are an LLM-search optimisation expert. Rewrite content so it ranks well in AI-powered search (ChatGPT, Perplexity, Google AI Overviews) and gets cited by AI assistants.

Strict rules:
- ONLY use statistics/facts found in the Vault Context. Never invent numbers.
- Preserve the existing voice and intent — enhance, do not replace wholesale.
- [Source N] format for citations (e.g. "47% of young Australians [Source 1]").
- Append a "## Sources" section listing each source used.
- FAQ format: ## Frequently Asked Questions, then Q: ... on one line, A: ... on the next.
- Meta title ≤ 60 characters. Meta description ≤ 160 characters.
- Return ONLY a JSON object — no markdown prose outside the JSON block.`;

  const bodyInstruction = bodyChecks.length > 0
    ? `\n\nPATCH 1 — field "body": rewrite the full body addressing ALL of these:\n${bodyCheckLines}\n\nCurrent body:\n"""\n${page.body}\n"""`
    : '';

  const fieldInstructions = [
    needTitle     ? `PATCH — field "title": make specific, entity-rich, 4+ words. Current: "${page.title}"` : '',
    needMetaTitle ? `PATCH — field "meta_title": ≤60 chars, keyword-rich. Current: "${page.metaTitle || page.title}"` : '',
    needMetaDesc  ? `PATCH — field "meta_desc": ≤160 chars, compelling, includes org name. Current: "${page.metaDesc}"` : '',
    needExcerpt   ? `PATCH — field "excerpt": 1–2 sentences summarising the page value. Current: "${page.excerpt}"` : '',
  ].filter(Boolean).join('\n');

  const authorHint = authorNote
    ? '\n\nNOTE: the "author" check cannot be fixed via content — remind the editor to set a named author in the Blog admin.'
    : '';

  const userPrompt = `${vaultText ? `## Vault Context\n${vaultText}\n\n` : ''}## Page: ${page.title}
Type: ${page.type} | AISEO score: ${ai.score}/100${bodyInstruction}

${fieldInstructions}${authorHint}

Return JSON:
{
  "patches": [
    {
      "check_keys": ["facts", "structure"],
      "field": "body",
      "field_label": "Body content",
      "optimized": "...(full rewritten value)...",
      "explanation": "Added 3 statistics from vault, structured with 4 section headings, appended FAQ"
    }
  ]
}`;

  const svc = new AnthropicService();
  let raw: string;
  try {
    const result = await svc.generateContent(systemPrompt, userPrompt, {
      model: 'gpt-4o', maxTokens: 4000, temperature: 0.3, timeout: 90_000,
    });
    raw = result.content;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  type RawPatch = { check_keys: string[]; field: string; field_label: string; optimized: string; explanation: string };
  const parsed = tryParseJson<{ patches: RawPatch[] }>(raw);
  if (!parsed?.patches?.length) {
    return NextResponse.json({ error: 'AI returned unexpected format — try again' }, { status: 502 });
  }

  const originals: Record<string, string> = {
    body:       page.body,
    title:      page.title,
    meta_title: page.metaTitle,
    meta_desc:  page.metaDesc,
    excerpt:    page.excerpt,
  };
  const defaultLabels: Record<string, string> = {
    body: 'Body content', title: 'Title',
    meta_title: 'Meta title', meta_desc: 'Meta description', excerpt: 'Excerpt',
  };

  const patches: OptimizePatch[] = parsed.patches.map(p => ({
    check_keys:  Array.isArray(p.check_keys) ? p.check_keys : [],
    field:       p.field ?? 'body',
    field_label: p.field_label ?? defaultLabels[p.field] ?? p.field,
    original:    originals[p.field] ?? '',
    optimized:   p.optimized ?? '',
    explanation: p.explanation ?? '',
  }));

  // Estimate post-patch score
  const patchedBody  = patches.find(p => p.field === 'body')?.optimized  ?? page.body;
  const patchedTitle = patches.find(p => p.field === 'title')?.optimized ?? page.title;
  const afterAi = scoreAiSeo({
    title: patchedTitle, bodyText: patchedBody,
    hasAuthor: Boolean(page.author), publishDate: page.publishDate,
    type: page.type,
  });

  return NextResponse.json({
    page: pageReport, patches, vault_refs: vaultRefs,
    ai_score_before: ai.score,
    ai_score_after:  afterAi.score,
  } satisfies OptimizeResult);
});

/* ─── PATCH — apply accepted patches to the DB ───────────────────────────── */

export const PATCH = requireStaff(async (req: NextRequest) => {
  const { id, type, patches } = await req.json() as {
    id:      string;
    type:    string;
    patches: Array<{ field: string; optimized: string }>;
  };

  if (!id || !type || !patches?.length) {
    return NextResponse.json({ error: 'id, type, and patches required' }, { status: 400 });
  }

  const FIELD_MAP: Record<string, Record<string, string>> = {
    blog:  { body: 'content',  title: 'title', meta_title: 'meta_title', meta_desc: 'meta_desc',  excerpt: 'excerpt' },
    event: { body: 'body',     title: 'title', meta_title: 'seo_title',  meta_desc: 'seo_desc',   excerpt: 'description' },
    page:  { title: 'title',   meta_title: 'meta_title', meta_desc: 'meta_desc', excerpt: 'description' },
  };

  const map = FIELD_MAP[type] ?? {};
  const updates: Record<string, string> = {};
  for (const patch of patches) {
    const col = map[patch.field];
    if (col) updates[col] = patch.optimized;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No applicable fields for this content type' }, { status: 400 });
  }

  const TABLE = type === 'blog' ? 'blog_posts' : type === 'event' ? 'events' : 'pages';
  const sb    = adminClient();
  const { error } = await sb.from(TABLE).update(updates).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, updated: Object.keys(updates) });
});
