// Supabase Edge Function: submit-vote
// Deploy: supabase functions deploy submit-vote
//
// GET  ?slug=<entity_slug>&type=<entity_type>   → vote counts
// POST { entity_type, entity_slug, vote, feedback?, contact? } → insert vote

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function anonClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);

  // ── GET: fetch counts ────────────────────────────────────────────────────
  if (req.method === "GET") {
    const slug = url.searchParams.get("slug");
    const type = url.searchParams.get("type") ?? "issue";
    if (!slug) return json({ error: "slug required" }, 400);

    const sb = anonClient();
    const { data, error } = await sb
      .from("data_vote_counts")
      .select("up_count,down_count,total")
      .eq("entity_slug", slug)
      .eq("entity_type", type)
      .single();

    if (error && error.code !== "PGRST116") return json({ error: error.message }, 500);
    return json({
      up:    Number(data?.up_count  ?? 0),
      down:  Number(data?.down_count ?? 0),
      total: Number(data?.total     ?? 0),
    });
  }

  // ── POST: insert vote ────────────────────────────────────────────────────
  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return json({ error: "Invalid JSON" }, 400); }

    const { entity_type, entity_slug, vote, feedback, contact } = body as Record<string, string>;
    if (!entity_slug || !vote)       return json({ error: "entity_slug and vote are required" }, 400);
    if (!["up", "down"].includes(vote)) return json({ error: "vote must be 'up' or 'down'" }, 400);

    // Hash IP for spam detection — never stored in plain text
    const forwarded = req.headers.get("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0].trim() || "unknown";
    const msgBuffer = new TextEncoder().encode(ip + entity_slug);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const ip_hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16);

    const sb = anonClient();
    const { error } = await sb.from("data_votes").insert({
      entity_type: entity_type ?? "issue",
      entity_slug,
      vote,
      feedback: (feedback as string)?.trim() || null,
      contact:  (contact  as string)?.trim() || null,
      ip_hash,
    });

    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
});
