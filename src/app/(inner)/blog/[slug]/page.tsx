/**
 * Public blog article — /blog/[slug]
 *
 * blog_posts.content is stored either as TipTap HTML (admin-authored
 * posts via RichTextEditor) OR raw markdown (posts pushed in from the
 * content-creator pipeline). We auto-detect: if it starts with an HTML
 * tag we render it as-is (sanitised), otherwise we run a tiny markdown
 * pass that handles paragraphs, **bold** headings, **inline bold**,
 * bullet lists and `---` dividers — same subset the content-creator
 * prompt emits.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient, createStaticClient } from "@/lib/supabase/server";

interface Props { params: Promise<{ slug: string }> }

export const revalidate = 60;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb
    .from("blog_posts")
    .select("title, excerpt, meta_title, meta_desc, og_image, feature_image")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!data) return { title: "Post Not Found" };
  const title = data.meta_title || data.title;
  const description = data.meta_desc || data.excerpt || undefined;
  const image = data.og_image || data.feature_image || undefined;
  return {
    title: `${title} — National Check-in Week`,
    description,
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function generateStaticParams() {
  const sb = createStaticClient();
  if (!sb) return [];
  const { data } = await sb
    .from("blog_posts")
    .select("slug")
    .eq("published", true);
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

/* ─── Markdown → HTML (only when content isn't already HTML) ──────────── */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function markdownToHtml(src: string): string {
  const text = src.replace(/\r\n/g, "\n").trim();
  const groups = text.split(/\n{2,}/);
  const out: string[] = [];

  for (const rawGroup of groups) {
    const group = rawGroup.trim();
    if (!group) continue;

    // Divider
    if (/^-{3,}$/.test(group)) {
      out.push('<hr class="blog-divider" />');
      continue;
    }

    // Heading — whole single-line group wrapped in **...**
    const headingMatch = /^\*\*(.+?)\*\*$/.exec(group);
    if (headingMatch && !group.includes("\n")) {
      out.push(`<h2>${inline(headingMatch[1])}</h2>`);
      continue;
    }

    // Bullet list — every line starts with "- " or "* "
    const lines = group.split("\n");
    if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
      const items = lines
        .map((l) => `<li>${inline(l.trim().replace(/^[-*]\s+/, ""))}</li>`)
        .join("");
      out.push(`<ul>${items}</ul>`);
      continue;
    }

    // Paragraph — intra-group newlines → <br>
    const html = lines.map(inline).join("<br/>");
    out.push(`<p>${html}</p>`);
  }
  return out.join("\n");
}

/** Handle inline `**bold**` and leave everything else escaped. */
function inline(s: string): string {
  return escapeHtml(s).replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
}

function renderContent(raw: string | null): string {
  const content = (raw ?? "").trim();
  if (!content) return "";
  // Heuristic: if it begins with an HTML tag (or a CDATA-ish prefix),
  // treat the whole thing as TipTap HTML. Otherwise markdown.
  if (/^<[a-z!]/i.test(content)) return content;
  return markdownToHtml(content);
}

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/* ─── Page ────────────────────────────────────────────────────────────── */

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: post } = await sb
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!post) notFound();

  const bodyHtml = renderContent(post.content);
  const dateLabel = formatDate(post.published_at ?? post.created_at);

  return (
    <>
      <article className="blog-article">
        {/* Hero */}
        <header className="blog-article__hero">
          <div className="blog-article__hero-inner">
            <Link href="/blog" className="blog-article__back">← All articles</Link>
            <h1 className="blog-article__title">{post.title}</h1>
            <div className="blog-article__meta">
              {post.author && <span>By {post.author}</span>}
              {post.author && dateLabel && <span aria-hidden>·</span>}
              {dateLabel && <time dateTime={post.published_at ?? post.created_at}>{dateLabel}</time>}
            </div>
          </div>
        </header>

        {/* Feature image */}
        {post.feature_image && (
          <div className="blog-article__image">
            <Image
              src={post.feature_image}
              alt={post.title}
              width={1200}
              height={675}
              sizes="(max-width: 900px) 100vw, 900px"
              style={{ width: "100%", height: "auto", borderRadius: 12 }}
              unoptimized
              priority
            />
          </div>
        )}

        {/* Body */}
        <div className="blog-article__body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

        <footer className="blog-article__footer">
          <Link href="/blog" className="swa-btn">← Back to all articles</Link>
        </footer>
      </article>

      {/* Scoped styles — small enough to live with the route and avoids
          touching global inner.css. Uses variables already defined there
          where possible. */}
      <style>{`
        .blog-article { max-width: 880px; margin: 0 auto; padding: 0 20px 64px; }
        .blog-article__hero { padding: 48px 0 24px; }
        .blog-article__hero-inner { display: flex; flex-direction: column; gap: 14px; }
        .blog-article__back { color: #6366F1; font-size: 13px; font-weight: 600; text-decoration: none; }
        .blog-article__back:hover { text-decoration: underline; }
        .blog-article__title { font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 800; color: #1E1040; line-height: 1.15; margin: 0; }
        .blog-article__meta { display: flex; gap: 8px; flex-wrap: wrap; color: #6B7280; font-size: 13px; }
        .blog-article__image { margin: 12px 0 32px; }
        .blog-article__body { font-size: 17px; line-height: 1.75; color: #1F2937; }
        .blog-article__body h2 { font-size: 1.6rem; font-weight: 800; color: #1E1040; margin: 36px 0 14px; line-height: 1.25; }
        .blog-article__body h3 { font-size: 1.25rem; font-weight: 700; color: #1E1040; margin: 28px 0 12px; }
        .blog-article__body p { margin: 0 0 16px; }
        .blog-article__body ul, .blog-article__body ol { margin: 0 0 20px; padding-left: 24px; }
        .blog-article__body li { margin-bottom: 6px; }
        .blog-article__body a { color: #6366F1; text-decoration: underline; }
        .blog-article__body strong { color: #1E1040; }
        .blog-article__body hr.blog-divider,
        .blog-article__body hr { border: none; border-top: 1px solid #E5E7EB; margin: 32px 0; }
        .blog-article__body blockquote { border-left: 4px solid #6366F1; padding: 8px 16px; margin: 20px 0; color: #4B5563; background: #F9FAFB; border-radius: 4px; }
        .blog-article__footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #E5E7EB; }
      `}</style>
    </>
  );
}
