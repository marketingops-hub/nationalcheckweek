import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";

export const runtime = "edge";

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb
    .from("cms_pages")
    .select("id, slug, title, meta_description, published, updated_at")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = requireAdmin(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const sb = adminClient();
  const { data, error } = await sb.from("cms_pages").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
