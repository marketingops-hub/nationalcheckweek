import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";

export const runtime = "edge";

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
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  
  // Basic validation
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!body.slug || typeof body.slug !== "string") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  
  const sb = adminClient();
  
  // Separate speakers from event fields
  const { speakers, ...eventFields } = body;
  
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
  
  return NextResponse.json(data);
});
