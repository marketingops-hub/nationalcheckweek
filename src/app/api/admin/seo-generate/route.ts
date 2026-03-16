import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

/**
 * POST /api/admin/seo-generate
 * Mass-generate SEO title + description for a batch of records.
 * Body: { table: "events"|"areas"|"issues", ids: string[] }
 * Returns: { results: { id, seo_title, seo_desc }[] }
 */
export async function POST(req: NextRequest) {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const openaiKey    = process.env.OPENAI_API_KEY;

  // Auth check
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get OpenAI key from api_keys table if not in env
  let apiKey = openaiKey;
  if (!apiKey) {
    const admin = createClient(supabaseUrl, serviceKey);
    const { data } = await admin.from("api_keys").select("key_value").eq("key_name", "openai").single();
    apiKey = data?.key_value;
  }
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });

  const { table, ids } = await req.json() as { table: string; ids: string[] };
  if (!table || !ids?.length) return NextResponse.json({ error: "table and ids required" }, { status: 400 });

  // Fetch records
  const admin = createClient(supabaseUrl, serviceKey);
  let selectFields = "id, title, tagline, description";
  if (table === "areas")  selectFields = "id, name, state, overview";
  if (table === "issues") selectFields = "id, title, anchor_stat, short_desc";

  const { data: rawRecords, error: fetchErr } = await admin
    .from(table)
    .select(selectFields)
    .in("id", ids);

  if (fetchErr || !rawRecords) {
    return NextResponse.json({ error: fetchErr?.message ?? "Fetch failed" }, { status: 500 });
  }

  const records = (rawRecords as unknown) as Record<string, unknown>[];
  const openai = new OpenAI({ apiKey });
  const results: { id: string; seo_title: string; seo_desc: string }[] = [];

  for (const rec of records) {
    const id = rec.id as string;
    let context = "";
    if (table === "events") {
      context = `Event title: "${rec.title ?? ""}"\nTagline: "${rec.tagline ?? ""}"\nDescription: "${rec.description ?? ""}"`;
    } else if (table === "areas") {
      context = `Area: "${rec.name ?? ""}", ${rec.state ?? ""}\nOverview: "${rec.overview ?? ""}"`;
    } else if (table === "issues") {
      context = `Issue: "${rec.title ?? ""}"\nKey stat: "${rec.anchor_stat ?? ""}"\nSummary: "${rec.short_desc ?? ""}"`;
    }

    try {
      const chat = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an SEO expert writing for an Australian school wellbeing platform. Generate concise, compelling SEO metadata. Return ONLY valid JSON with keys seo_title (max 60 chars) and seo_desc (max 155 chars). No markdown, no explanation.",
          },
          { role: "user", content: context },
        ],
        temperature: 0.4,
        max_tokens: 200,
      });

      const raw = chat.choices[0]?.message?.content?.trim() ?? "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as { seo_title?: string; seo_desc?: string };
      results.push({ id, seo_title: parsed.seo_title ?? "", seo_desc: parsed.seo_desc ?? "" });

      // Write back to DB immediately
      await admin.from(table).update({
        seo_title: parsed.seo_title ?? "",
        seo_desc:  parsed.seo_desc  ?? "",
      }).eq("id", id);

    } catch {
      results.push({ id, seo_title: "", seo_desc: "" });
    }
  }

  return NextResponse.json({ results });
}
