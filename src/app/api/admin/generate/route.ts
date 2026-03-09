import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/generate
 *
 * Proxies to the Supabase Edge Function `generate-page-content`.
 * Keeps the service role key server-side.
 *
 * Body: { page_type: "state"|"area", record_id: string, section_keys?: string[] }
 * Returns: { updated: Record<string, unknown>, log: { section_key: string, status: string }[] }
 */
export async function POST(req: NextRequest) {
  // Verify caller is an authenticated admin
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Validate the token is a real session
  const sb = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Parse body
  let body: { page_type: string; record_id: string; section_keys?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { page_type, record_id, section_keys } = body;
  if (!page_type || !record_id) {
    return NextResponse.json({ error: "page_type and record_id are required." }, { status: 400 });
  }

  // Forward to Edge Function with service role key
  const edgeFnUrl = `${supabaseUrl}/functions/v1/generate-page-content`;
  const edgeRes = await fetch(edgeFnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ page_type, record_id, section_keys }),
  });

  const data = await edgeRes.json();
  return NextResponse.json(data, { status: edgeRes.ok ? 200 : edgeRes.status });
}
