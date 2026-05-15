import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { PartnerPatchSchema, parseBody } from "@/lib/adminSchemas";
import { revalidateEntity } from "@/lib/revalidate";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/admin/partners/[id] — by id or slug
export const GET = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let data, error;
  if (isUuid) {
    ({ data, error } = await sb.from("Partner").select("*").eq("id", id).maybeSingle());
    if (!data && !error) {
      ({ data, error } = await sb.from("Partner").select("*").eq("slug", id).maybeSingle());
    }
  } else {
    ({ data, error } = await sb.from("Partner").select("*").eq("slug", id).maybeSingle());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  return NextResponse.json({ partner: data });
});

// PATCH /api/admin/partners/[id]
export const PATCH = requireAdmin(async (req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(PartnerPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  if (parsed.data.slug !== undefined) {
    const { data: existing } = await sb
      .from("Partner")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const { data, error } = await sb
    .from("Partner")
    .update({ ...parsed.data, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateEntity('partner', data.slug);
  return NextResponse.json({ partner: data });
});

// DELETE /api/admin/partners/[id]
export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.from("Partner").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateEntity('partner');
  return NextResponse.json({ ok: true });
});
