import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/adminAuth";
import { UserPatchSchema, parseBody } from "@/lib/adminSchemas";

type RouteCtx = { params: Promise<{ id: string }> };

export const PATCH = async (req: NextRequest, ctx: RouteCtx) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  const { id } = await ctx.params;
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(UserPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();

  if ('send_reset' in parsed.data && parsed.data.send_reset) {
    const { error } = await sb.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/login`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, string> = {};
  if ('email' in parsed.data && parsed.data.email) updates.email = parsed.data.email;
  if ('password' in parsed.data && parsed.data.password) updates.password = parsed.data.password;
  const { error } = await sb.auth.admin.updateUserById(id, updates);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
};

export const DELETE = async (_req: NextRequest, ctx: RouteCtx) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  const { id } = await ctx.params;
  const sb = adminClient();
  const { error } = await sb.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
};
