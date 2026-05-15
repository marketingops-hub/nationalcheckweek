// Supabase Edge Function: ambassador-apply
// Deploy: supabase functions deploy ambassador-apply
//
// POST { first_name, last_name, email, why_ambassador, ...optional fields }
// → inserts to ambassador_applications + fires HubSpot async

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
  const formId   = Deno.env.get("HUBSPOT_APPLY_FORM_ID");
  if (!portalId || !formId) return;

  await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      fields:  fields.filter((f) => f.value.trim() !== ""),
      context: { pageName },
    }),
  }).catch((e) => console.error("[HubSpot] apply:", e));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  let body: Record<string, string>;
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  const { first_name, last_name, email, why_ambassador } = body;
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !why_ambassador?.trim()) {
    return json({ error: "first_name, last_name, email and why_ambassador are required." }, 400);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { error } = await sb.from("ambassador_applications").insert({
    first_name:     first_name.trim(),
    last_name:      last_name.trim(),
    email:          email.trim().toLowerCase(),
    phone:          body.phone?.trim()         || null,
    organisation:   body.organisation?.trim()  || null,
    role_title:     body.role_title?.trim()    || null,
    state:          body.state                 || null,
    category_id:    body.category_id           || null,
    why_ambassador: why_ambassador.trim(),
    experience:     body.experience?.trim()    || null,
    linkedin_url:   body.linkedin_url?.trim()  || null,
    website_url:    body.website_url?.trim()   || null,
  });

  if (error) return json({ error: error.message }, 500);

  // Fire-and-forget HubSpot — does not block the response
  EdgeRuntime.waitUntil(fireHubSpot([
    { name: "firstname",    value: first_name.trim() },
    { name: "lastname",     value: last_name.trim() },
    { name: "email",        value: email.trim().toLowerCase() },
    { name: "phone",        value: body.phone?.trim()         ?? "" },
    { name: "company",      value: body.organisation?.trim()  ?? "" },
    { name: "jobtitle",     value: body.role_title?.trim()    ?? "" },
    { name: "state",        value: body.state                 ?? "" },
    { name: "message",      value: why_ambassador.trim() },
    { name: "experience",   value: body.experience?.trim()    ?? "" },
    { name: "linkedin_url", value: body.linkedin_url?.trim()  ?? "" },
    { name: "website",      value: body.website_url?.trim()   ?? "" },
  ], "Ambassador Application"));

  return json({ ok: true });
});
