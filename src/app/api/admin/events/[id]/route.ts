import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = adminClient();
  const { data, error } = await sb
    .from("events")
    .select("*, event_speakers(*)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const sb = adminClient();

  // Separate speakers from event fields
  const { speakers, ...eventFields } = body;
  const { data, error } = await sb
    .from("events")
    .update({ ...eventFields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync speakers if provided
  if (Array.isArray(speakers)) {
    await sb.from("event_speakers").delete().eq("event_id", id);
    if (speakers.length > 0) {
      await sb.from("event_speakers").insert(
        speakers.map((s: Record<string, unknown>, i: number) => ({ ...s, event_id: id, sort_order: i }))
      );
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = adminClient();
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
