import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

async function hashIp(ip: string, slug: string): Promise<string> {
  const buf = new TextEncoder().encode(ip + slug);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// POST /api/votes
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { entity_type, entity_slug, vote, feedback, contact } = body;

  if (!entity_slug || !vote) {
    return NextResponse.json({ error: "entity_slug and vote are required" }, { status: 400 });
  }
  if (!["up", "down"].includes(vote)) {
    return NextResponse.json({ error: "vote must be 'up' or 'down'" }, { status: 400 });
  }

  // Hash IP for privacy — we store it only to detect obvious spam
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0].trim() || "unknown";
  const ip_hash = await hashIp(ip, entity_slug);

  const sb = anonClient();

  const { error } = await sb.from("data_votes").insert({
    entity_type: entity_type ?? "issue",
    entity_slug,
    vote,
    feedback: feedback?.trim() || null,
    contact: contact?.trim() || null,
    ip_hash,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/votes?slug=school-belonging&type=issue
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const type = req.nextUrl.searchParams.get("type") ?? "issue";
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const sb = anonClient();
  const { data, error } = await sb
    .from("data_vote_counts")
    .select("up_count,down_count,total")
    .eq("entity_slug", slug)
    .eq("entity_type", type)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    up: Number(data?.up_count ?? 0),
    down: Number(data?.down_count ?? 0),
    total: Number(data?.total ?? 0),
  });
}
