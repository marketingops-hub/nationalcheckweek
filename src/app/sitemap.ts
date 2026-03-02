import { MetadataRoute } from "next";
import { ISSUES } from "@/lib/issues";
import { AREAS } from "@/lib/areas";

const BASE = "https://schoolswellbeing.com.au";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
    ...stateRoutes,
    ...issueRoutes,
    ...areaRoutes,
  ];
}
