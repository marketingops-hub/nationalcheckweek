import { MetadataRoute } from "next";
import { createStaticClient } from "@/lib/supabase/server";

const BASE = "https://nationalcheckinweek.com";

type SitemapEntry = MetadataRoute.Sitemap[number];

async function fetchSlugs(
  table: string,
  filter?: { column: string; value: unknown },
  orderBy?: string
): Promise<{ slug: string; updated_at?: string | null }[]> {
  const sb = createStaticClient();
  if (!sb) return [];
  let q = sb.from(table).select("slug, updated_at");
  if (filter) q = q.eq(filter.column, filter.value) as typeof q;
  if (orderBy) q = q.order(orderBy) as typeof q;
  const { data } = await q;
  return data ?? [];
}

function toEntry(
  path: string,
  row: { slug: string; updated_at?: string | null },
  opts: { changeFrequency: SitemapEntry["changeFrequency"]; priority: number },
  now: Date
): SitemapEntry {
  return {
    url: `${BASE}${path}/${row.slug}`,
    lastModified: row.updated_at ? new Date(row.updated_at) : now,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [issues, states, areas, blog] = await Promise.all([
    fetchSlugs("issues", undefined, "rank"),
    fetchSlugs("states", undefined, "name"),
    fetchSlugs("areas"),
    fetchSlugs("blog_posts", { column: "published", value: true }),
  ]);

  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/issues`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/states`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/ambassadors`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/events`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/partners`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...issues.map((r) => toEntry("/issues", r, { changeFrequency: "monthly", priority: 0.8 }, now)),
    ...states.map((r) => toEntry("/states", r, { changeFrequency: "monthly", priority: 0.8 }, now)),
    ...areas.map((r) => toEntry("/areas", r, { changeFrequency: "monthly", priority: 0.6 }, now)),
    ...blog.map((r) => toEntry("/blog", r, { changeFrequency: "monthly", priority: 0.7 }, now)),
  ];
}
