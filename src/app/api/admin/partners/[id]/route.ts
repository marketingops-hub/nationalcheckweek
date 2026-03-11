import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/admin/partners/[id] — by id or slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = adminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = sb.from("Partner").select("*");
  if (isUuid) {
    query = query.or(`slug.eq.${id},id.eq.${id}`);
  } else {
    query = query.eq("slug", id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  return NextResponse.json({ partner: data });
}

// PATCH /api/admin/partners/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = adminClient();
  const body = await req.json();
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description || null;
  if (body.logoUrl !== undefined) patch.logoUrl = body.logoUrl || null;
  if (body.url !== undefined) patch.url = body.url || null;
  if (body.slug !== undefined) {
    const { data: existing } = await sb
      .from("Partner")
      .select("id")
      .eq("slug", body.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    patch.slug = body.slug;
  }
  if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
  if (typeof body.active === "boolean") patch.active = body.active;

  const { data, error } = await sb
    .from("Partner")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partner: data });
}

// DELETE /api/admin/partners/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = adminClient();
  const { error } = await sb.from("Partner").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
