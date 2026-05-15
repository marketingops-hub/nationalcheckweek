import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb
    .from("pages")
    .select("id, slug, title, status, show_in_menu, updated_at, category, area_slug, issue_slug")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = requireAdmin(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { slug, title, description, content, status, show_in_menu, meta_title, meta_desc, og_image } = body;
  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!slug?.trim())  return NextResponse.json({ error: "slug is required" },  { status: 400 });
  const sb = adminClient();
  const { data, error } = await sb
    .from("pages")
    .insert({
      slug:         slug.trim(),
      title:        title.trim(),
      description:  description  ?? "",
      content:      content      ?? [],
      status:       status       ?? "draft",
      show_in_menu: show_in_menu ?? false,
      meta_title:   meta_title   ?? "",
      meta_desc:    meta_desc    ?? "",
      og_image:     og_image     ?? "",
    })
    .select("id")
    .single();
  if (error) {
    const msg = error.code === "23505" ? "A page with this slug already exists." : error.message;
    return NextResponse.json({ error: msg }, { status: error.code === "23505" ? 409 : 500 });
  }
  return NextResponse.json(data, { status: 201 });
});
