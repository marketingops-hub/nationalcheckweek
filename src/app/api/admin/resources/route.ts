import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { ResourcePostSchema, parseBody } from "@/lib/adminSchemas";

export const runtime = "edge";

// GET /api/admin/resources
export const GET = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const showAll = req.nextUrl.searchParams.get("all") === "true";

  if (showAll) {
    const { data, error } = await sb
      .from("Resource")
      .select("*")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resources: data ?? [] });
  }

  const { data, error } = await sb
    .from("Resource")
    .select("id, name, description, thumbnailUrl, url, slug, category")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resources: data ?? [] });
});

// POST /api/admin/resources
export const POST = requireAdmin(async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(ResourcePostSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  const { data: existing } = await sb
    .from("Resource")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const { data, error } = await sb
    .from("Resource")
    .insert({ ...parsed.data, updatedAt: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resource: data });
});
