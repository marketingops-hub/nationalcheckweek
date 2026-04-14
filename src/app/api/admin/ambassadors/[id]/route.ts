import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { AmbassadorPatchSchema, parseBody } from "@/lib/adminSchemas";

export const runtime = "edge";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/admin/ambassadors/[id] — by id or slug
export const GET = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
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
});

// PATCH /api/admin/ambassadors/[id]
export const PATCH = requireAdmin(async (req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(AmbassadorPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString(), ...parsed.data };

  if (parsed.data.slug !== undefined) {
    const { data: existing } = await sb
      .from("Ambassador")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const { data, error } = await sb
    .from("Ambassador")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ambassador: data });
});

// DELETE /api/admin/ambassadors/[id]
export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.from("Ambassador").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
