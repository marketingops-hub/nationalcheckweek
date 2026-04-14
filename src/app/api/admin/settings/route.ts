import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/adminAuth";
import { SettingsPatchSchema, parseBody } from "@/lib/adminSchemas";

export const GET = async () => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  const sb = adminClient();
  const { data, error } = await sb.from("site_settings").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const map: Record<string, string> = {};
  (data ?? []).forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
  return NextResponse.json(map);
};

export const PATCH = async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(SettingsPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  const updates = Object.entries(parsed.data).map(([key, value]) =>
    sb.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() })
  );
  const results = await Promise.all(updates);
  const err = results.find(r => r.error);
  if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
};
