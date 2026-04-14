import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET() {
  const sb = await createClient();

  // Try with event_link first; fall back if column doesn't exist yet
  let records: Record<string, unknown>[] | null = null;
  let error: { message: string } | null = null;

  const primary = await sb
    .from("Ambassador")
    .select("id, name, title, photoUrl, comment, event_link, sortOrder")
    .eq("active", true)
    .order("sortOrder", { ascending: true });

  if (primary.error && primary.error.message?.includes("event_link")) {
    const fallback = await sb
      .from("Ambassador")
      .select("id, name, title, photoUrl, comment, sortOrder")
      .eq("active", true)
      .order("sortOrder", { ascending: true });
    records = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  } else {
    records = primary.data as Record<string, unknown>[] | null;
    error = primary.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { ambassadors: records ?? [] },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } }
  );
}
