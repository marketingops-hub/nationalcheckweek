import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import OpenAI from "openai";

export const runtime = "edge";

/**
 * POST /api/admin/verify
 *
 * Sends issue content to OpenAI for fact-checking.
 * Returns verification status, notes, suggested sources, and annotated content.
 *
 * Body: {
 *   content: string,
 *   section_label: string,
 *   issue_title: string,
 *   existing_source_count: number
 * }
 */
export const POST = requireAdmin(async (req: NextRequest) => {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  // ── Parse body ──
  let body: {
    content: string;
    section_label: string;
    issue_title: string;
    existing_source_count: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { content, section_label, issue_title, existing_source_count } = body;
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  // ── Call OpenAI ──
  const startNum = (existing_source_count ?? 0) + 1;

  const systemPrompt = `You are a fact-checking assistant for "National Check-in Week", an Australian student wellbeing data website.

Your job:
1. Read the provided content and determine if the statistics, claims, and data are factually plausible and accurate.
2. Find real, authoritative sources (Australian government, AIHW, ABS, university research, WHO, peer-reviewed journals) that support or contradict the claims.
3. Annotate the original content by inserting inline citation markers like (${startNum}), (${startNum + 1}), etc. next to the claims they support. Only add markers where a source actually backs the claim.
4. Return your response as valid JSON only — no markdown, no code fences.

JSON format:
{
  "status": "verified" | "partially_verified" | "unverified",
  "confidence": "high" | "medium" | "low",
  "notes": "Brief explanation of verification findings",
  "sources": [
    {
      "num": ${startNum},
      "title": "Full title of the source document",
      "url": "https://...",
      "publisher": "Organisation name",
      "year": "2024"
    }
  ],
  "annotated_content": "The original text with (${startNum}) citation markers inserted."
}

Rules:
- Only suggest REAL sources with real URLs. Do not invent URLs.
- If you cannot find a real source for a claim, note it in "notes" and mark status accordingly.
- Citation numbers start at ${startNum} to avoid conflicts with existing sources.
- Keep the original content wording intact — only insert (N) markers.
- Australian data sources are preferred (AIHW, ABS, Productivity Commission, state health departments).`;

  const userPrompt = `Issue: "${issue_title}"
Section: "${section_label}"

Content to verify:
---
${content}
---`;

  try {
    const openai = new OpenAI({ apiKey: openaiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "OpenAI returned invalid JSON.", raw }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OpenAI request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
});
