import { MetadataRoute } from "next";
import { ISSUES } from "@/lib/issues";
import { AREAS } from "@/lib/areas";
import { createStaticClient } from "@/lib/supabase/server";

const BASE = "https://nationalcheckinweek.com";

const STATE_SLUGS = [
  "new-south-wales",
  "victoria",
  "queensland",
  "south-australia",
  "western-australia",
  "tasmania",
  "northern-territory",
  "australian-capital-territory",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Blog — every published post, pulled live. Falls back to empty on
  // build-time DB unavailability so the sitemap still renders.
  const sb = createStaticClient();
  let blogRoutes: MetadataRoute.Sitemap = [];
  if (sb) {
    const { data } = await sb
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("published", true);
    blogRoutes = (data ?? []).map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? now),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  }

  const stateRoutes = STATE_SLUGS.map((slug) => ({
    url: `${BASE}/states/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const issueRoutes = ISSUES.map((issue) => ({
    url: `${BASE}/issues/${issue.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const areaRoutes = AREAS.map((area) => ({
    url: `${BASE}/areas/${area.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogRoutes,
    ...stateRoutes,
    ...issueRoutes,
    ...areaRoutes,
  ];
}
