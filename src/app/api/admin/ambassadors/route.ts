import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";

export const runtime = "edge";

// GET /api/admin/ambassadors
export const GET = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const showAll = req.nextUrl.searchParams.get("all") === "true";

  if (showAll) {
    // Optimized query - only fetch fields needed for list view (exclude bio for performance)
    const { data, error } = await sb
      .from("Ambassador")
      .select("id, name, title, photoUrl, slug, linkedinUrl, websiteUrl, categoryId, sortOrder, active, createdAt, updatedAt, ambassador_categories(id, name, slug, color, icon)")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Add cache headers for better performance (30 seconds)
    return NextResponse.json(
      { ambassadors: data ?? [] },
      { 
        headers: { 
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' 
        } 
      }
    );
  }

  const { data, error } = await sb
    .from("Ambassador")
    .select("id, name, title, bio, photoUrl, slug, linkedinUrl, websiteUrl, categoryId, ambassador_categories(id, name, slug, color, icon)")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ambassadors: data ?? [] });
});

// POST /api/admin/ambassadors
export const POST = requireAdmin(async (req: NextRequest) => {
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
      comment: body.comment || null,
      event_link: body.event_link || null,
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ambassador: data });
});
