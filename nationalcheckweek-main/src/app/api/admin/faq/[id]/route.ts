import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { FaqPatchSchema, parseBody } from "@/lib/adminSchemas";
import { revalidateEntity } from "@/lib/revalidate";

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH /api/admin/faq/[id]
export const PATCH = requireAdmin(async (req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(FaqPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  const { data, error } = await sb
    .from("Faq")
    .update({ ...parsed.data, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateEntity('faq');
  return NextResponse.json({ faq: data });
});

// DELETE /api/admin/faq/[id]
export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.from("Faq").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateEntity('faq');
  return NextResponse.json({ ok: true });
});
