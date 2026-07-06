import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { UserPatchSchema, parseBody } from "@/lib/adminSchemas";

type RouteCtx = { params: Promise<{ id: string }> };

export const PATCH = requireAdmin(async (req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(UserPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();

  if ('send_reset' in parsed.data && parsed.data.send_reset) {
    // Prefer the configured site URL; otherwise derive the origin from the
    // request so the reset link points at the deployment the admin is using,
    // not localhost. Only fall back to localhost as a last resort (dev).
    const forwardedHost = req.headers.get("x-forwarded-host");
    const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
    const requestOrigin = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : req.nextUrl.origin;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? requestOrigin ?? "http://localhost:3000";

    const { error } = await sb.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteUrl}/admin/login`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, string> = {};
  if ('email' in parsed.data && parsed.data.email) updates.email = parsed.data.email;
  if ('password' in parsed.data && parsed.data.password) updates.password = parsed.data.password;

  if (Object.keys(updates).length > 0) {
    const { error } = await sb.auth.admin.updateUserById(id, updates);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update role in user_profiles if provided
  if ('role' in parsed.data && parsed.data.role) {
    await sb.from('user_profiles').upsert({ id, role: parsed.data.role }, { onConflict: 'id' });
  }

  return NextResponse.json({ ok: true });
});

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
});
