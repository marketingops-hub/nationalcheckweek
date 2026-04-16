import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import { EventPutSchema, parseBody } from "@/lib/adminSchemas";

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { data, error } = await sb
    .from("events")
    .select("*, event_speakers(*)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json(data);
});

export const PUT = requireAdmin(async (req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(EventPutSchema, raw);
  if (!parsed.ok) return parsed.response;

  const { speakers, ...eventFields } = parsed.data;
  const sb = adminClient();
  const { data, error } = await sb
    .from("events")
    .update({ ...eventFields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync speakers if provided
  if (Array.isArray(speakers)) {
    const { error: deleteError } = await sb.from("event_speakers").delete().eq("event_id", id);
    if (deleteError) return NextResponse.json({ error: `Failed to delete speakers: ${deleteError.message}` }, { status: 500 });
    
    if (speakers.length > 0) {
      const { error: insertError } = await sb.from("event_speakers").insert(
        speakers.map((s: Record<string, unknown>, i: number) => ({ ...s, event_id: id, sort_order: i }))
      );
      if (insertError) return NextResponse.json({ error: `Failed to insert speakers: ${insertError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json(data);
});

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
