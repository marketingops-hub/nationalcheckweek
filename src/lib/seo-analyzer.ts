/* ═══════════════════════════════════════════════════════════════════════════
 * SEO + AISEO page analyzer
 *
 * Two scoring domains, each 0–100:
 *
 * SEO (traditional) — title/meta length, OG image, content depth, headings,
 *   slug quality, excerpt.
 *
 * AISEO (LLM / AI-search readiness) — factual density (numbers, stats),
 *   author attribution, publish date, heading structure, entity clarity,
 *   organization name signals, source references, FAQ-style content.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface SeoCheck {
  key:     string;
  label:   string;
  status:  CheckStatus;
  message: string;
  points:  number;
  max:     number;
}

export interface PageReport {
  id:        string;
  type:      'blog' | 'event' | 'page';
  title:     string;
  slug:      string;
  url:       string;
  editUrl:   string;
  seoScore:  number;
  aiScore:   number;
  seoChecks: SeoCheck[];
  aiChecks:  SeoCheck[];
}

/* ─── Text helpers ───────────────────────────────────────────────────────── */

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasHeadings(text: string): boolean {
  // Markdown headings, bold-only headings (** **), or HTML h tags
  return /^#{1,4}\s|\*\*[^*]{4,80}\*\*|<h[1-4]/m.test(text);
}

function hasNumbers(text: string): boolean {
  // Statistics, percentages, numbered facts
  return /\b\d+\s*%|\b\d{2,}\s*(students|schools|children|young people|percent|per cent|kids|teens|adolescents)/i.test(text) ||
         /\b(one in|1 in)\s+\d+/i.test(text) ||
         (/\b\d{3,}\b/.test(text) && /\b(survey|study|research|report|data|statistics|found|showed|indicates)/i.test(text));
}

function hasSources(text: string): boolean {
  return /\[Source|\bSource\s*\d|\baccording to\b|\bResearch by\b|\bData from\b|\bReport by\b/i.test(text);
}

function hasFaq(text: string): boolean {
  // Q&A patterns: a question followed by content
  return /\?[\s\S]{10,300}[A-Z]/.test(text) ||
         /\b(what|why|how|when|who|does|can|should|will)\b.{5,60}\?/i.test(text);
}

function hasOrganizationName(text: string): boolean {
  return /national check[- ]?in week|national checkin|NCW\b|LifeSkills|beyondblue|beyond blue|Headspace|headspace/i.test(text);
}

function hasProperNouns(text: string): boolean {
  // 3+ distinct proper nouns (sequences of Title Case words not at sentence start)
  const matches = text.match(/(?<![.!?]\s)[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,}){1,3}/g) ?? [];
  const unique = new Set(matches.map(m => m.toLowerCase()));
  return unique.size >= 3;
}

function titleIsSpecific(title: string): boolean {
  if (!title) return false;
  const generic = /^(home|about|contact|services|page|post|event|article|news|blog)$/i;
  if (generic.test(title.trim())) return false;
  if (title.length < 20) return false;
  // Contains a number, organisation name, or specific descriptor
  return /\d/.test(title) || /[A-Z]{2,}/.test(title) || title.split(/\s+/).length >= 4;
}

/** Extract plain text from Supabase JSONB page blocks */
export function extractBlockText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (typeof n.content === 'string') parts.push(n.content);
    if (typeof n.text    === 'string') parts.push(n.text);
    if (Array.isArray(n.children))    (n.children as unknown[]).forEach(walk);
    if (Array.isArray(n.blocks))      (n.blocks   as unknown[]).forEach(walk);
    if (Array.isArray(n.items))       (n.items    as unknown[]).forEach(walk);
  }
  blocks.forEach(walk);
  return parts.join('\n');
}

/* ─── SEO scoring ────────────────────────────────────────────────────────── */

interface SeoInput {
  title:       string;
  slug:        string;
  metaTitle:   string;
  metaDesc:    string;
  ogImage:     string;
  bodyText:    string;
  excerpt:     string;
  hasAuthor:   boolean;
  publishDate: string | null;
}

export function scoreSeo(i: SeoInput): { score: number; checks: SeoCheck[] } {
  const checks: SeoCheck[] = [];
  let pts = 0; let max = 0;

  function check(key: string, label: string, status: CheckStatus, message: string, points: number, maxPts: number) {
    checks.push({ key, label, status, message, points, max: maxPts });
    pts += points; max += maxPts;
  }

  // Meta title
  const mt = (i.metaTitle || i.title || '').trim();
  if (!mt) {
    check('meta_title', 'Meta title', 'fail', 'No meta title set', 0, 15);
  } else if (mt.length < 20) {
    check('meta_title', 'Meta title', 'warn', `Too short — ${mt.length} chars (aim for 30–60)`, 8, 15);
  } else if (mt.length > 65) {
    check('meta_title', 'Meta title', 'warn', `Too long — ${mt.length} chars (aim for 30–60, max ~65)`, 8, 15);
  } else {
    check('meta_title', 'Meta title', 'pass', `Good length — ${mt.length} chars`, 15, 15);
  }

  // Meta description
  const md = (i.metaDesc || '').trim();
  if (!md) {
    check('meta_desc', 'Meta description', 'fail', 'No meta description set', 0, 15);
  } else if (md.length < 80) {
    check('meta_desc', 'Meta description', 'warn', `Too short — ${md.length} chars (aim for 120–160)`, 8, 15);
  } else if (md.length > 165) {
    check('meta_desc', 'Meta description', 'warn', `Too long — ${md.length} chars (max ~160)`, 8, 15);
  } else {
    check('meta_desc', 'Meta description', 'pass', `Good length — ${md.length} chars`, 15, 15);
  }

  // OG / feature image
  if (i.ogImage) {
    check('og_image', 'Social image (OG)', 'pass', 'OG/feature image is set', 10, 10);
  } else {
    check('og_image', 'Social image (OG)', 'fail', 'No OG or feature image — affects social previews', 0, 10);
  }

  // Slug
  const slugLen = i.slug.length;
  const slugClean = /^[a-z0-9-]+$/.test(i.slug);
  if (!slugClean) {
    check('slug', 'URL slug', 'fail', 'Slug contains uppercase or special chars', 0, 10);
  } else if (slugLen > 60) {
    check('slug', 'URL slug', 'warn', `Slug is long (${slugLen} chars) — aim for under 60`, 5, 10);
  } else {
    check('slug', 'URL slug', 'pass', `Clean slug, ${slugLen} chars`, 10, 10);
  }

  // Content length
  const words = countWords(i.bodyText);
  if (words < 100) {
    check('content_length', 'Content length', 'fail', `Very thin — ${words} words. Aim for 300+`, 0, 20);
  } else if (words < 300) {
    check('content_length', 'Content length', 'warn', `${words} words — aim for 300+ for good coverage`, 8, 20);
  } else if (words < 600) {
    check('content_length', 'Content length', 'warn', `${words} words — 600+ is ideal for authority`, 13, 20);
  } else {
    check('content_length', 'Content length', 'pass', `${words} words — solid content depth`, 20, 20);
  }

  // Headings
  if (hasHeadings(i.bodyText)) {
    check('headings', 'Heading structure', 'pass', 'Content uses headings to structure sections', 10, 10);
  } else {
    check('headings', 'Heading structure', 'warn', 'No headings detected — add section headings to aid scannability', 0, 10);
  }

  // Excerpt / description
  if (i.excerpt && i.excerpt.length >= 30) {
    check('excerpt', 'Excerpt / description', 'pass', 'Has a summary excerpt', 5, 5);
  } else {
    check('excerpt', 'Excerpt / description', 'warn', 'No excerpt set — used in cards and search snippets', 0, 5);
  }

  // Missing author (blog only — event/pages don't always need one)
  // (Handled in AISEO but counts slightly here too)

  return { score: max > 0 ? Math.round((pts / max) * 100) : 0, checks };
}

/* ─── AISEO scoring ──────────────────────────────────────────────────────── */

interface AiSeoInput {
  title:       string;
  bodyText:    string;
  hasAuthor:   boolean;
  publishDate: string | null;
  type:        'blog' | 'event' | 'page';
}

export function scoreAiSeo(i: AiSeoInput): { score: number; checks: SeoCheck[] } {
  const checks: SeoCheck[] = [];
  let pts = 0; let max = 0;

  function check(key: string, label: string, status: CheckStatus, message: string, points: number, maxPts: number) {
    checks.push({ key, label, status, message, points, max: maxPts });
    pts += points; max += maxPts;
  }

  // Factual density — numbers, statistics
  if (hasNumbers(i.bodyText)) {
    check('facts', 'Facts & statistics', 'pass', 'Contains specific numbers or statistics — high LLM citation value', 15, 15);
  } else {
    check('facts', 'Facts & statistics', 'fail', 'No specific statistics detected — LLMs prefer pages with concrete data', 0, 15);
  }

  // Author attribution
  if (i.hasAuthor) {
    check('author', 'Author attribution', 'pass', 'Named author builds E-E-A-T and LLM trustworthiness', 10, 10);
  } else {
    check('author', 'Author attribution', 'warn', 'No author set — add a named author for E-E-A-T signals', 0, 10);
  }

  // Publish / event date
  if (i.publishDate) {
    const age = (Date.now() - new Date(i.publishDate).getTime()) / (1000 * 60 * 60 * 24);
    if (age > 730) {
      check('freshness', 'Content freshness', 'warn', `Published ${Math.round(age / 30)} months ago — consider updating`, 5, 10);
    } else {
      check('freshness', 'Content freshness', 'pass', 'Recently published or updated', 10, 10);
    }
  } else {
    check('freshness', 'Content freshness', 'warn', 'No publish date — LLMs use date signals to assess relevance', 3, 10);
  }

  // Heading structure
  if (hasHeadings(i.bodyText)) {
    check('structure', 'Structured headings', 'pass', 'Heading hierarchy helps LLMs parse topic segments', 10, 10);
  } else {
    check('structure', 'Structured headings', 'fail', 'No headings — add section headings for better LLM parsing', 0, 10);
  }

  // Content depth
  const words = countWords(i.bodyText);
  if (words >= 600) {
    check('depth', 'Content depth', 'pass', `${words} words — LLMs prefer comprehensive coverage`, 10, 10);
  } else if (words >= 300) {
    check('depth', 'Content depth', 'warn', `${words} words — 600+ words signals topic authority to LLMs`, 5, 10);
  } else {
    check('depth', 'Content depth', 'fail', `${words} words — too thin for LLM citation consideration`, 0, 10);
  }

  // Organization name clarity
  if (hasOrganizationName(i.bodyText + ' ' + i.title)) {
    check('entity', 'Organisation named', 'pass', 'Content clearly identifies the organisation', 10, 10);
  } else {
    check('entity', 'Organisation named', 'warn', 'No clear organisation name — LLMs need entity anchors', 0, 10);
  }

  // Specific proper nouns
  if (hasProperNouns(i.bodyText)) {
    check('proper_nouns', 'Named entities', 'pass', 'Contains specific proper nouns — high entity clarity', 10, 10);
  } else {
    check('proper_nouns', 'Named entities', 'warn', 'Few named entities — add specific names, places, or programs', 3, 10);
  }

  // Title specificity
  if (titleIsSpecific(i.title)) {
    check('title_specific', 'Specific title', 'pass', 'Title is concrete and descriptive', 10, 10);
  } else {
    check('title_specific', 'Specific title', 'warn', 'Title is generic — specific titles get cited more by AI', 3, 10);
  }

  // FAQ / Q&A patterns
  if (hasFaq(i.bodyText)) {
    check('faq', 'Q&A / FAQ patterns', 'pass', 'Contains question-answer patterns — great for featured snippets and AI answers', 5, 5);
  } else {
    check('faq', 'Q&A / FAQ patterns', 'warn', 'No Q&A patterns — consider adding FAQ sections', 0, 5);
  }

  // Source citations
  if (hasSources(i.bodyText)) {
    check('sources', 'Source citations', 'pass', 'Content cites sources — increases LLM credibility score', 10, 10);
  } else {
    check('sources', 'Source citations', 'warn', 'No source citations detected — citing research boosts AISEO', 0, 10);
  }

  return { score: max > 0 ? Math.round((pts / max) * 100) : 0, checks };
}
