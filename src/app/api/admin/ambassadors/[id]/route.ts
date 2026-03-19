import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/admin/ambassadors/[id] — by id or slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = adminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let data, error;
  if (isUuid) {
    ({ data, error } = await sb.from("Ambassador").select("*").eq("id", id).maybeSingle());
    if (!data && !error) {
      ({ data, error } = await sb.from("Ambassador").select("*").eq("slug", id).maybeSingle());
    }
  } else {
    ({ data, error } = await sb.from("Ambassador").select("*").eq("slug", id).maybeSingle());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Ambassador not found" }, { status: 404 });
  return NextResponse.json({ ambassador: data });
}

// PATCH /api/admin/ambassadors/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = adminClient();
  const body = await req.json();
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (body.name !== undefined) patch.name = body.name;
  if (body.title !== undefined) patch.title = body.title || null;
  if (body.bio !== undefined) patch.bio = body.bio || null;
  if (body.photoUrl !== undefined) patch.photoUrl = body.photoUrl || null;
  if (body.slug !== undefined) {
    const { data: existing } = await sb
      .from("Ambassador")
      .select("id")
      .eq("slug", body.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    patch.slug = body.slug;
  }
  if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
  if (typeof body.active === "boolean") patch.active = body.active;
  if (body.linkedinUrl !== undefined) patch.linkedinUrl = body.linkedinUrl || null;
  if (body.websiteUrl !== undefined) patch.websiteUrl = body.websiteUrl || null;
  if (body.categoryId !== undefined) patch.categoryId = body.categoryId || null;

  const { data, error } = await sb
    .from("Ambassador")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ambassador: data });
}

// DELETE /api/admin/ambassadors/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = adminClient();
  const { error } = await sb.from("Ambassador").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
