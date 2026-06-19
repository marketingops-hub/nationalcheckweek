/* ═══════════════════════════════════════════════════════════════════════════
 * to-markdown.ts
 *
 * Lightweight HTML → Markdown converter for LLM/AI-scraper serving.
 * Handles the content formats used in this project:
 *   - Raw Markdown strings (stored as-is in blog_posts.content)
 *   - HTML strings (from rich-text editors)
 *   - JSONB block arrays (CMS pages)
 *
 * No external dependencies — the goal is clean, token-efficient output
 * for AI consumers, not pixel-perfect HTML fidelity.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ─── HTML → Markdown ────────────────────────────────────────────────────── */

export function htmlToMarkdown(html: string): string {
  if (!html?.trim()) return '';

  let md = html
    // Remove script / style / nav / header / footer / aside blocks entirely
    .replace(/<(script|style|nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Headings
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n# ${strip(t)}\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n## ${strip(t)}\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n### ${strip(t)}\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `\n#### ${strip(t)}\n`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, t) => `\n##### ${strip(t)}\n`)
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, t) => `\n###### ${strip(t)}\n`)
    // Strong / em
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `**${strip(c)}**`)
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi,     (_, _t, c) => `_${strip(c)}_`)
    // Links
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const t = strip(text).trim();
      if (!t) return '';
      const absHref = href.startsWith('http') ? href : `https://nationalcheckinweek.com${href}`;
      return `[${t}](${absHref})`;
    })
    // Images — emit alt text as caption
    .replace(/<img[^>]+alt="([^"]*)"[^>]*\/?>/gi, (_, alt) => alt ? `\n> 📷 ${alt}\n` : '')
    // Lists
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${strip(c)}\n`)
    .replace(/<\/?[uo]l[^>]*>/gi, '\n')
    // Blockquote
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => `\n> ${strip(c).split('\n').join('\n> ')}\n`)
    // Code
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, c) => `\n\`\`\`\n${c}\n\`\`\`\n`)
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => `\`${c}\``)
    // Horizontal rule
    .replace(/<hr[^>]*\/?>/gi, '\n---\n')
    // Paragraphs / divs / sections → blank-line separated
    .replace(/<\/?(p|div|section|article|main)[^>]*>/gi, '\n')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return md;
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/* ─── Already-Markdown passthrough ──────────────────────────────────────── */

export function cleanMarkdown(md: string): string {
  if (!md?.trim()) return '';
  // Collapse excessive blank lines, trim
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

/* ─── JSONB block array → Markdown ──────────────────────────────────────── */

export function blocksToMarkdown(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(blockToMd).filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function blockToMd(block: unknown): string {
  if (!block || typeof block !== 'object') return '';
  const b = block as Record<string, unknown>;
  const type = (b.type ?? b.kind ?? '') as string;

  // Text / paragraph
  if (['paragraph', 'text', 'body'].includes(type)) {
    return extractText(b);
  }
  // Headings
  if (type.startsWith('heading') || type === 'h2' || type === 'h3') {
    const level = typeof b.level === 'number' ? b.level : type === 'h2' ? 2 : type === 'h3' ? 3 : 2;
    return `${'#'.repeat(level)} ${extractText(b)}`;
  }
  // Bullet list
  if (['list', 'bullet_list', 'bulleted_list'].includes(type)) {
    const items = (b.items ?? b.children ?? []) as unknown[];
    return (items as unknown[]).map(i => `- ${extractText(i as Record<string,unknown>)}`).join('\n');
  }
  // Image
  if (type === 'image') {
    const src = (b.src ?? b.url ?? '') as string;
    const alt = (b.alt ?? b.caption ?? '') as string;
    return alt ? `> 📷 ${alt}` : '';
  }
  // Quote / callout
  if (['blockquote', 'quote', 'callout'].includes(type)) {
    return `> ${extractText(b)}`;
  }
  // Stats / CTA — just extract text
  return extractText(b);
}

function extractText(node: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof node.text    === 'string') parts.push(node.text.trim());
  if (typeof node.content === 'string') parts.push(node.content.trim());
  if (typeof node.value   === 'string') parts.push(node.value.trim());
  if (typeof node.heading === 'string') parts.push(node.heading.trim());
  if (typeof node.body    === 'string') parts.push(htmlToMarkdown(node.body as string));
  if (Array.isArray(node.children)) {
    for (const c of node.children as unknown[]) {
      if (typeof c === 'string') parts.push(c.trim());
      else if (c && typeof c === 'object') parts.push(extractText(c as Record<string,unknown>));
    }
  }
  if (Array.isArray(node.blocks)) {
    for (const c of node.blocks as unknown[]) {
      if (c && typeof c === 'object') parts.push(blockToMd(c));
    }
  }
  return parts.filter(Boolean).join(' ').trim();
}

/* ─── Detect content format ──────────────────────────────────────────────── */

export function anyToMarkdown(content: unknown, description?: string): string {
  if (!content && !description) return '';

  // JSONB block array
  if (Array.isArray(content)) {
    const md = blocksToMarkdown(content);
    return description ? `${description}\n\n${md}` : md;
  }
  // String — detect HTML vs Markdown
  if (typeof content === 'string') {
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    const body   = isHtml ? htmlToMarkdown(content) : cleanMarkdown(content);
    return description ? `${description}\n\n${body}` : body;
  }
  return (description as string) ?? '';
}
