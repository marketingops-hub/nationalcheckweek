// Supabase Edge Function: ambassador-nominate
// Deploy: supabase functions deploy ambassador-nominate
//
// POST { nominee_first_name, nominee_last_name, reason, nominator_name, nominator_email, ...optional }
// → inserts to ambassador_nominations + fires HubSpot async

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function fireHubSpot(fields: { name: string; value: string }[], pageName: string) {
  const portalId = Deno.env.get("HUBSPOT_PORTAL_ID");
  const formId   = Deno.env.get("HUBSPOT_NOMINATE_FORM_ID");
  if (!portalId || !formId) return;

  await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      fields:  fields.filter((f) => f.value.trim() !== ""),
      context: { pageName },
    }),
  }).catch((e) => console.error("[HubSpot] nominate:", e));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  let body: Record<string, string>;
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  const { nominee_first_name, nominee_last_name, reason, nominator_name, nominator_email } = body;
  if (!nominee_first_name?.trim() || !nominee_last_name?.trim() || !reason?.trim() || !nominator_name?.trim() || !nominator_email?.trim()) {
    return json({ error: "Nominee name, reason, and your name and email are required." }, 400);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { error } = await sb.from("ambassador_nominations").insert({
    nominee_first_name:   nominee_first_name.trim(),
    nominee_last_name:    nominee_last_name.trim(),
    nominee_email:        body.nominee_email?.trim().toLowerCase() || null,
    nominee_phone:        body.nominee_phone?.trim()               || null,
    nominee_organisation: body.nominee_organisation?.trim()        || null,
    nominee_role_title:   body.nominee_role_title?.trim()          || null,
    nominee_state:        body.nominee_state                       || null,
    category_id:          body.category_id                         || null,
    reason:               reason.trim(),
    nominee_linkedin:     body.nominee_linkedin?.trim()            || null,
    nominator_name:       nominator_name.trim(),
    nominator_email:      nominator_email.trim().toLowerCase(),
    nominator_phone:      body.nominator_phone?.trim()             || null,
    nominator_relation:   body.nominator_relation?.trim()          || null,
  });

  if (error) return json({ error: error.message }, 500);

  EdgeRuntime.waitUntil(fireHubSpot([
    { name: "firstname",          value: nominee_first_name.trim() },
    { name: "lastname",           value: nominee_last_name.trim() },
    { name: "email",              value: body.nominee_email?.trim().toLowerCase() ?? "" },
    { name: "phone",              value: body.nominee_phone?.trim()               ?? "" },
    { name: "company",            value: body.nominee_organisation?.trim()        ?? "" },
    { name: "jobtitle",           value: body.nominee_role_title?.trim()          ?? "" },
    { name: "state",              value: body.nominee_state                        ?? "" },
    { name: "message",            value: reason.trim() },
    { name: "linkedin_url",       value: body.nominee_linkedin?.trim()            ?? "" },
    { name: "nominator_name",     value: nominator_name.trim() },
    { name: "nominator_email",    value: nominator_email.trim().toLowerCase() },
    { name: "nominator_phone",    value: body.nominator_phone?.trim()             ?? "" },
    { name: "nominator_relation", value: body.nominator_relation?.trim()          ?? "" },
  ], "Ambassador Nomination"));

  return json({ ok: true });
});
