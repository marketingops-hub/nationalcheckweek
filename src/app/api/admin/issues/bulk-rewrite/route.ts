import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const FIELD_PROMPTS: Record<string, string> = {
  short_desc:      "Write a compelling 2-3 sentence short description for this wellbeing issue. Focus on the real-world impact on Australian school students. Be factual and evidence-informed.",
  definition:      "Write a precise, accurate definition of this wellbeing issue as it applies to Australian school students. Include key dimensions and how it manifests in school settings. 2-4 sentences.",
  australian_data: "Summarise the key Australian data and research on this issue. Reference real data sources where mentioned. Be specific with any statistics. 3-5 sentences.",
  mechanisms:      "Explain the mechanisms by which this issue affects student learning and wellbeing in Australian schools. Focus on the causal pathways — how does it actually impair learning? 3-5 sentences.",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { id, fields, tone } = body as {
    id: string;
    fields: string[];
    tone: string;
  };

  if (!id || !fields?.length) {
    return NextResponse.json({ error: "id and fields are required" }, { status: 400 });
  }

  const sb = adminClient();

  // Fetch current issue
  const { data: issue, error: fetchErr } = await sb
    .from("issues")
    .select("id, title, slug, severity, anchor_stat, short_desc, definition, australian_data, mechanisms")
    .eq("id", id)
    .single();

  if (fetchErr || !issue) {
    return NextResponse.json({ error: fetchErr?.message ?? "Issue not found" }, { status: 404 });
  }

  // Get active OpenAI key
  const { data: keyRow } = await sb
    .from("api_keys")
    .select("key_value")
    .eq("provider", "openai")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const apiKey = keyRow?.key_value ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No OpenAI API key configured" }, { status: 500 });

  const openai = new OpenAI({ apiKey });

  const toneInstructions: Record<string, string> = {
    professional: "Write in a professional, authoritative tone suitable for a policy and education audience.",
    accessible:   "Write in plain, accessible language suitable for a general public audience including parents and teachers.",
    urgent:       "Write in an urgent, compelling tone that conveys the seriousness of this issue.",
    academic:     "Write in an academic, evidence-based tone with precise language.",
  };

  const updates: Record<string, string> = {};

  for (const field of fields) {
    const fieldPrompt = FIELD_PROMPTS[field];
    if (!fieldPrompt) continue;

    const currentValue = (issue as Record<string, unknown>)[field] as string ?? "";

    const systemPrompt = `You are an expert in Australian school student wellbeing and mental health.
${toneInstructions[tone] ?? toneInstructions.professional}
You are rewriting content for the website "National Check-in Week", which advocates for data-led wellbeing in Australian schools.
Output ONLY the rewritten text with no preamble, labels, or explanation.`;

    const userPrompt = `Issue: ${issue.title} (severity: ${issue.severity})
Anchor stat: ${issue.anchor_stat}

Task: ${fieldPrompt}

Current text (use as context, improve upon it):
${currentValue}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const rewritten = completion.choices[0]?.message?.content?.trim() ?? "";
    if (rewritten) updates[field] = rewritten;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No fields were rewritten" }, { status: 500 });
  }

  // Save back to DB
  const { error: updateErr } = await sb
    .from("issues")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, updated: Object.keys(updates) });
}
