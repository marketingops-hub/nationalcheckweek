import { NextRequest, NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

/**
 * POST /api/admin/firecrawl/crawl
 *
 * Body: { url: string }
 *
 * Scrapes the given URL using Firecrawl and returns the markdown content,
 * page title, and description. The API key is kept server-side only.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FIRECRAWL_API_KEY is not configured on the server." }, { status: 500 });
  }

  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "url is required." }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  const app = new FirecrawlApp({ apiKey });

  let result;
  try {
    result = await app.scrape(url, { formats: ["markdown"] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Firecrawl scrape failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({
    markdown: result.markdown ?? null,
    title: (result.metadata as { title?: string } | undefined)?.title ?? null,
    description: (result.metadata as { description?: string } | undefined)?.description ?? null,
    metadata: result.metadata ?? null,
  });
}
