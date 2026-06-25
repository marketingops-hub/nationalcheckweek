import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qxcdeyvfeipyfojpxosh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
    minimumCacheTTL: 86400,
  },

  async headers() {
    return [
      {
        // Immutable cache for hashed Next.js static assets (_next/static)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache public API responses for 60s with stale-while-revalidate
        source: "/api/(partners|ambassador-voices|ambassadors|events)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        // Security headers on all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Enforce HTTPS for two years incl. subdomains. No `preload` — that
          // is a hard-to-reverse commitment we can add later once confident.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Disable powerful browser features the app never uses. Shrinks the
          // attack surface if a third-party script is ever compromised.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Conservative CSP: only the directives that cannot break the app's
          // many third-party integrations (HubSpot, Vimeo, Loom, Supabase,
          // Sentry). `frame-ancestors` hardens clickjacking (complements
          // X-Frame-Options), `object-src 'none'` blocks legacy plugin
          // vectors, `base-uri 'self'` blocks <base>-tag hijacking, and
          // `form-action 'self'` stops form exfiltration to foreign origins.
          // A full script-src/connect-src allowlist is a tracked follow-up
          // that must be validated against live traffic in staging first.
          {
            key: "Content-Security-Policy",
            value: [
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              "form-action 'self' https://*.hsforms.com https://*.hubspot.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "national-check-week",
  project: "javascript-nextjs",
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  },
});
