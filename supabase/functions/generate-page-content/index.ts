// Supabase Edge Function: generate-page-content
// Deploy: supabase functions deploy generate-page-content
//
// POST body:
// {
//   page_type: "state" | "area",
//   record_id: string,           // uuid of the states or areas row
//   section_keys?: string[]      // omit to regenerate all sections for this page_type
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header." }, 401);
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const { page_type, record_id, section_keys } = await req.json() as {
      page_type: "state" | "area";
      record_id: string;
      section_keys?: string[];
    };

    if (!page_type || !record_id) {
      return json({ error: "page_type and record_id are required." }, 400);
    }
    if (page_type !== "state" && page_type !== "area") {
      return json({ error: "page_type must be 'state' or 'area'." }, 400);
    }

    // ── Supabase client (service role) ────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── OpenAI key ────────────────────────────────────────────────────────
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return json({ error: "OPENAI_API_KEY is not set." }, 500);
    }

    // ── Fetch the record ──────────────────────────────────────────────────
    const table = page_type === "state" ? "states" : "areas";
    const { data: record, error: recErr } = await sb
      .from(table)
      .select("*")
      .eq("id", record_id)
      .single();
    if (recErr || !record) {
      return json({ error: `Record not found: ${recErr?.message}` }, 404);
    }

    const stateName = page_type === "state"
      ? (record.name as string)
      : (record.state as string);
    const cityName  = page_type === "area" ? (record.name as string) : "";

    // ── Fetch prompt templates ────────────────────────────────────────────
    let promptQuery = sb
      .from("prompt_templates")
      .select("section_key, prompt, model")
      .eq("page_type", page_type);

    if (section_keys && section_keys.length > 0) {
      promptQuery = promptQuery.in("section_key", section_keys);
    }

    const { data: templates, error: tplErr } = await promptQuery;
    if (tplErr || !templates || templates.length === 0) {
      return json({ error: `No prompt templates found: ${tplErr?.message}` }, 404);
    }

    // ── Fetch approved vault sources (knowledge base) ─────────────────────
    const { data: sources } = await sb
      .from("vault_sources")
      .select("url, title, description")
      .eq("is_approved", true)
      .limit(20);

    const vaultContext = sources && sources.length > 0
      ? "Approved Australian data sources you may reference:\n" +
        sources.map((s: { url: string; title: string; description: string }) =>
          `- ${s.title || s.url}: ${s.url}${s.description ? ` — ${s.description}` : ""}`
        ).join("\n")
      : "";

    // ── Generate each section ─────────────────────────────────────────────
    const results: Record<string, unknown> = {};
    const logRows: {
      page_type: string; record_id: string; record_name: string;
      section_key: string; status: string; output?: string; error?: string;
    }[] = [];

    for (const tpl of templates) {
      const prompt = tpl.prompt
        .replace(/\{\{state_name\}\}/g, stateName)
        .replace(/\{\{city_name\}\}/g, cityName);

      const systemPrompt = [
        "You are a precise content writer for an Australian student wellbeing data website.",
        "Always cite only real, verifiable Australian data from the approved sources provided.",
        "Never invent statistics. Be concise and factual.",
        vaultContext,
      ].filter(Boolean).join("\n\n");

      try {
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: tpl.model || "gpt-4o",
            temperature: 0.4,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user",   content: prompt },
            ],
          }),
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          throw new Error(`OpenAI error ${aiRes.status}: ${errText}`);
        }

        const aiJson = await aiRes.json() as {
          choices: { message: { content: string } }[];
        };
        const raw = aiJson.choices[0]?.message?.content?.trim() ?? "";

        // Parse JSON sections; keep plain text for others
        const JSON_SECTIONS = ["issues", "key_stats"];
        let parsed: unknown = raw;
        if (JSON_SECTIONS.includes(tpl.section_key)) {
          try {
            // Strip potential markdown code fences
            const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
            parsed = JSON.parse(cleaned);
          } catch {
            // Fallback: return raw string — admin can fix manually
            parsed = raw;
          }
        }

        results[tpl.section_key] = parsed;
        logRows.push({
          page_type, record_id, record_name: record.name,
          section_key: tpl.section_key, status: "success",
          output: typeof parsed === "string" ? parsed.slice(0, 2000) : JSON.stringify(parsed).slice(0, 2000),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results[tpl.section_key] = null;
        logRows.push({
          page_type, record_id, record_name: record.name,
          section_key: tpl.section_key, status: "error", error: msg,
        });
      }
    }

    // ── Write generation log ──────────────────────────────────────────────
    if (logRows.length > 0) {
      await sb.from("generation_log").insert(logRows);
    }

    return json({ updated: results, log: logRows.map(r => ({ section_key: r.section_key, status: r.status })) });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
