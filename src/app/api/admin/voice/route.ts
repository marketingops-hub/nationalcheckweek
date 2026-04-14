import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/adminAuth";

const VOICE_KEYS = ["voice_heading", "voice_body", "voice_cta_text", "voice_cta_url", "voice_enabled"];

export const GET = async () => {
  const sb = adminClient();
  const { data, error } = await sb
    .from("site_settings")
    .select("key, value")
    .in("key", VOICE_KEYS);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const map: Record<string, string> = {};
  (data ?? []).forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
  return NextResponse.json(map);
};

export const PATCH = async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const MAX_LENGTHS: Record<string, number> = {
    heading: 120, body: 2000, cta_text: 60, cta_url: 500,
  };
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (field in body && typeof body[field] === "string" && (body[field] as string).length > max) {
      return NextResponse.json({ error: `${field} must be ${max} characters or fewer` }, { status: 400 });
    }
  }

  const sb = adminClient();
  const shortKeys = ["heading", "body", "cta_text", "cta_url", "enabled"] as const;
  for (const short of shortKeys) {
    if (short in body) {
      const { error } = await sb.from("site_settings").upsert({
        key: `voice_${short}`,
        value: String(body[short]),
        updated_at: new Date().toISOString(),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  revalidatePath("/issues/[slug]", "page");
  return NextResponse.json({ ok: true });
};
