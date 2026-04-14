import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";
import OpenAI from "openai";

/**
 * POST /api/admin/seo-generate
 * Mass-generate SEO title + description for a batch of records.
 * Body: { table: "events"|"areas"|"issues"|"states", ids: string[] }
 * Returns: { results: { id, seo_title, seo_desc }[] }
 */

// Explicit allowlist — prevents table injection from arbitrary user input
const ALLOWED_TABLES: Record<string, string> = {
  events: "id, title, tagline, description",
  areas:  "id, name, state, overview",
  issues: "id, title, anchor_stat, short_desc",
  states: "id, name, subtitle",
};

export const POST = requireAdmin(async (req: NextRequest) => {
  const openaiKey = process.env.OPENAI_API_KEY;

  // Get OpenAI key from api_keys table if not in env
  let apiKey = openaiKey;
  if (!apiKey) {
    const admin = adminClient();
    const { data } = await admin.from("api_keys").select("key_value").eq("provider", "openai").eq("is_active", true).single();
    apiKey = data?.key_value;
  }
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });

  let parsed: { table: string; ids: string[] };
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { table, ids } = parsed;
  if (!table || !ids?.length) return NextResponse.json({ error: "table and ids required" }, { status: 400 });

  // Validate table name against explicit allowlist (prevents table injection)
  const selectFields = ALLOWED_TABLES[table];
  if (!selectFields) {
    return NextResponse.json(
      { error: `table must be one of: ${Object.keys(ALLOWED_TABLES).join(', ')}` },
      { status: 400 }
    );
  }

  const admin = adminClient();
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
    } else if (table === "states") {
      context = `Australian state/territory: "${rec.name ?? ""}"\nSubtitle: "${rec.subtitle ?? ""}"`;
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
      const { error: updateErr } = await admin.from(table).update({
        seo_title: parsed.seo_title ?? "",
        seo_desc:  parsed.seo_desc  ?? "",
      }).eq("id", id);
      if (updateErr) throw new Error(updateErr.message);

    } catch {
      results.push({ id, seo_title: "", seo_desc: "" });
    }
  }

  return NextResponse.json({ results });
});
