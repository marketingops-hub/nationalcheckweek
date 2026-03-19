import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/admin/ambassadors
export async function GET(req: NextRequest) {
  const sb = adminClient();
  const showAll = req.nextUrl.searchParams.get("all") === "true";

  if (showAll) {
    const { data, error } = await sb
      .from("Ambassador")
      .select("*, ambassador_categories(id, name, slug, color, icon)")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ambassadors: data ?? [] });
  }

  const { data, error } = await sb
    .from("Ambassador")
    .select("id, name, title, bio, photoUrl, slug, linkedinUrl, websiteUrl, categoryId, ambassador_categories(id, name, slug, color, icon)")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ambassadors: data ?? [] });
}

// POST /api/admin/ambassadors
export async function POST(req: NextRequest) {
  const sb = adminClient();
  const body = await req.json();

  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  // Check slug uniqueness
  const { data: existing } = await sb
    .from("Ambassador")
    .select("id")
    .eq("slug", body.slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const { data, error } = await sb
    .from("Ambassador")
    .insert({
      name: body.name,
      title: body.title || null,
      bio: body.bio || null,
      photoUrl: body.photoUrl || null,
      slug: body.slug,
      sortOrder: body.sortOrder ?? 0,
      active: body.active ?? true,
      linkedinUrl: body.linkedinUrl || null,
      websiteUrl: body.websiteUrl || null,
      categoryId: body.categoryId || null,
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ambassador: data });
}
