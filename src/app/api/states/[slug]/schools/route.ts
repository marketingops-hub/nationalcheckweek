import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { STATE_CODES } from "@/lib/schoolUtils";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const stateCode = STATE_CODES[slug];
  if (!stateCode) {
    return NextResponse.json({ error: "Unknown state slug" }, { status: 404 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb.rpc("get_state_school_stats", { p_state: stateCode });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.total_schools === 0) return NextResponse.json({ empty: true });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
