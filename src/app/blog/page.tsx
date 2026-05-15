/**
 * Public blog index — /blog
 *
 * Grid of every published blog_posts row. Card = feature image + title +
 * excerpt + published date. Both image and title link through to
 * /blog/[slug]. Mirrors the Resources page pattern for layout and uses
 * the existing `.profile-grid` / `.profile-card` styles from inner.css
 * so it feels native to the rest of the public site.
 */

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Blog — National Check-in Week",
  description:
    "Stories, guidance and evidence-based articles on student wellbeing, mental health in schools, and the National Check-in Week campaign.",
};

// Cache for 60s so the index isn't one query per request at scale; the
// admin's publish / unpublish flow will naturally re-cache on next hit.
export const revalidate = 60;

interface BlogPostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  feature_image: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
}

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default async function BlogIndexPage() {
  const sb = await createClient();
  // RLS already restricts to published=true for anon users, but we're
  // explicit so a future policy change doesn't silently leak drafts.
  const { data } = await sb
    .from("blog_posts")
    .select("id, title, slug, excerpt, feature_image, author, published_at, created_at")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at",  { ascending: false });

  const posts = (data ?? []) as BlogPostCard[];

  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">📝 Stories &amp; Guidance</div>
          <h1 className="page-hero__title">Blog</h1>
          <p className="page-hero__subtitle">
            Evidence-based articles on student wellbeing, mental health in schools, and the National Check-in Week campaign.
          </p>
        </div>
      </div>

      <main id="main-content" className="inner-content inner-content--wide">
        {posts.length === 0 && (
          <div className="empty-state">
            <p>New articles are on their way — check back soon.</p>
          </div>
        )}

        {posts.length > 0 && (
          <div className="profile-grid profile-grid--wide">
            {posts.map((p) => {
              const href = `/blog/${p.slug}`;
              return (
                <article key={p.id} className="profile-card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Feature image — click = open post. We use a plain
                      next/link with legacyBehavior-free nesting. */}
                  <Link href={href} aria-label={p.title} style={{ display: "block", position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#F3F4F6" }}>
                    {p.feature_image ? (
                      <Image
                        src={p.feature_image}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    ) : (
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#CBD5E1", fontSize: 48, fontWeight: 800,
                      }}>
                        {p.title.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div style={{ padding: "20px 20px 22px" }}>
                    <h2 className="profile-card__name" style={{ marginBottom: 8 }}>
                      <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>
                        {p.title}
                      </Link>
                    </h2>
                    {p.excerpt && <p className="profile-card__bio">{p.excerpt}</p>}
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {p.author && <span>By {p.author}</span>}
                      {p.author && (p.published_at || p.created_at) && <span>·</span>}
                      <time dateTime={p.published_at ?? p.created_at}>
                        {formatDate(p.published_at ?? p.created_at)}
                      </time>
                    </div>
                    <Link href={href} className="profile-card__cta" style={{ marginTop: 14, display: "inline-block" }}>
                      Read article →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
