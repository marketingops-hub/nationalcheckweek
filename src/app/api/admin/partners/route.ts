import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/admin/partners
export async function GET(req: NextRequest) {
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
}

// POST /api/admin/partners
export async function POST(req: NextRequest) {
  const sb = adminClient();
  const body = await req.json();

  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const { data: existing } = await sb
    .from("Partner")
    .select("id")
    .eq("slug", body.slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const { data, error } = await sb
    .from("Partner")
    .insert({
      name: body.name,
      description: body.description || null,
      logoUrl: body.logoUrl || null,
      url: body.url || null,
      slug: body.slug,
      sortOrder: body.sortOrder ?? 0,
      active: body.active ?? true,
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partner: data });
}
