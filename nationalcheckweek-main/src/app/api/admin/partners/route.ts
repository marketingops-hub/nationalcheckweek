import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { PartnerPostSchema, parseBody } from "@/lib/adminSchemas";

export const runtime = "edge";

// GET /api/admin/partners
export const GET = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const showAll = req.nextUrl.searchParams.get("all") === "true";

  if (showAll) {
    const { data, error } = await sb
      .from("Partner")
      .select("*")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ partners: data ?? [] });
  }

  const { data, error } = await sb
    .from("Partner")
    .select("id, name, description, logoUrl, url, slug")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partners: data ?? [] });
});

// POST /api/admin/partners
export const POST = requireAdmin(async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(PartnerPostSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  const { data: existing } = await sb
    .from("Partner")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const { data, error } = await sb
    .from("Partner")
    .insert({ ...parsed.data, updatedAt: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partner: data });
});
