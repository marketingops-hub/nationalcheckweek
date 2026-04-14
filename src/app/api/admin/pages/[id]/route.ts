import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { pickPageFields } from "@/lib/pageSchema";

type Ctx = { params: Promise<{ id: string }> };

async function resolveId(ctx: Ctx | undefined): Promise<string | null> {
  if (!ctx?.params) return null;
  const { id } = await ctx.params;
  return id ?? null;
}

export const GET = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const id = await resolveId(ctx);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const sb = adminClient();
  const { data, error } = await sb.from("pages").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
});

export const PUT = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const id = await resolveId(ctx);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const patch = pickPageFields(body);
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const sb = adminClient();
  const { data, error } = await sb
    .from("pages")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    const msg = error.code === "23505" ? "A page with this slug already exists." : error.message;
    return NextResponse.json({ error: msg }, { status: error.code === "23505" ? 409 : 500 });
  }
  return NextResponse.json(data);
});

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const id = await resolveId(ctx);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const sb = adminClient();
  const { error } = await sb.from("pages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
