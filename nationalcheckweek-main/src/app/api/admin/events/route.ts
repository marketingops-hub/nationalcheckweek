import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { EventPutSchema, parseBody } from "@/lib/adminSchemas";
import { revalidateEntity } from "@/lib/revalidate";

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb
    .from("events")
    .select("id,slug,title,tagline,event_date,event_time,format,feature_image,status,published,is_free,price,register_url,hubspot_form_id,hubspot_portal_id,created_at")
    .order("event_date", { ascending: false, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = requireAdmin(async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(EventPutSchema, raw);
  if (!parsed.ok) return parsed.response;

  const { speakers, ...eventFields } = parsed.data;
  const sb = adminClient();

  // Insert event
  const { data, error } = await sb.from("events").insert(eventFields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert speakers if provided
  if (Array.isArray(speakers) && speakers.length > 0) {
    await sb.from("event_speakers").insert(
      speakers.map((s: Record<string, unknown>, i: number) => ({
        ...s,
        event_id: data.id,
        sort_order: i
      }))
    );
  }

  revalidateEntity('event', data.slug);
  return NextResponse.json(data);
});
