import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { ResourcePatchSchema, parseBody } from "@/lib/adminSchemas";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/admin/resources/[id] — by id or slug
export const GET = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let data, error;
  if (isUuid) {
    ({ data, error } = await sb.from("Resource").select("*").eq("id", id).maybeSingle());
    if (!data && !error) {
      ({ data, error } = await sb.from("Resource").select("*").eq("slug", id).maybeSingle());
    }
  } else {
    ({ data, error } = await sb.from("Resource").select("*").eq("slug", id).maybeSingle());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  return NextResponse.json({ resource: data });
});

// PATCH /api/admin/resources/[id]
export const PATCH = requireAdmin(async (req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(ResourcePatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  if (parsed.data.slug !== undefined) {
    const { data: existing } = await sb
      .from("Resource")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const { data, error } = await sb
    .from("Resource")
    .update({ ...parsed.data, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resource: data });
});

// DELETE /api/admin/resources/[id]
export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.from("Resource").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
