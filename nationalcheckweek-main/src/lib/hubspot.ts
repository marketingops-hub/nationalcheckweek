/**
 * HubSpot Forms Submit API helper
 * Docs: https://legacydocs.hubspot.com/docs/methods/forms/submit_form
 *
 * Required env vars:
 *   HUBSPOT_PORTAL_ID          — your HubSpot account/portal ID
 *   HUBSPOT_APPLY_FORM_ID      — form ID for ambassador applications
 *   HUBSPOT_NOMINATE_FORM_ID   — form ID for ambassador nominations
 *
 * If env vars are not set, submissions are skipped silently (non-blocking).
 */

const HUBSPOT_BASE = "https://api.hsforms.com/submissions/v3/integration/submit";

interface HubSpotField {
  name:  string;
  value: string;
}

async function submitToHubSpot(
  formId: string,
  fields: HubSpotField[],
  pageName: string
): Promise<void> {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  if (!portalId || !formId) return;

  const res = await fetch(`${HUBSPOT_BASE}/${portalId}/${formId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields:  fields.filter((f) => f.value.trim() !== ""),
      context: { pageName },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[HubSpot] Submission failed (${res.status}):`, text);
  }
}

export async function submitAmbassadorApplication(data: {
  first_name:     string;
  last_name:      string;
  email:          string;
  phone?:         string | null;
  organisation?:  string | null;
  role_title?:    string | null;
  state?:         string | null;
  why_ambassador: string;
  experience?:    string | null;
  linkedin_url?:  string | null;
  website_url?:   string | null;
}): Promise<void> {
  await submitToHubSpot(
    process.env.HUBSPOT_APPLY_FORM_ID ?? "",
    [
      { name: "firstname",    value: data.first_name },
      { name: "lastname",     value: data.last_name },
      { name: "email",        value: data.email },
      { name: "phone",        value: data.phone         ?? "" },
      { name: "company",      value: data.organisation  ?? "" },
      { name: "jobtitle",     value: data.role_title    ?? "" },
      { name: "state",        value: data.state         ?? "" },
      { name: "message",      value: data.why_ambassador },
      { name: "experience",   value: data.experience    ?? "" },
      { name: "linkedin_url", value: data.linkedin_url  ?? "" },
      { name: "website",      value: data.website_url   ?? "" },
    ],
    "Ambassador Application"
  );
}

export async function submitAmbassadorNomination(data: {
  nominee_first_name:   string;
  nominee_last_name:    string;
  nominee_email?:       string | null;
  nominee_phone?:       string | null;
  nominee_organisation?: string | null;
  nominee_role_title?:  string | null;
  nominee_state?:       string | null;
  reason:               string;
  nominee_linkedin?:    string | null;
  nominator_name:       string;
  nominator_email:      string;
  nominator_phone?:     string | null;
  nominator_relation?:  string | null;
}): Promise<void> {
  await submitToHubSpot(
    process.env.HUBSPOT_NOMINATE_FORM_ID ?? "",
    [
      { name: "firstname",          value: data.nominee_first_name },
      { name: "lastname",           value: data.nominee_last_name },
      { name: "email",              value: data.nominee_email        ?? "" },
      { name: "phone",              value: data.nominee_phone        ?? "" },
      { name: "company",            value: data.nominee_organisation ?? "" },
      { name: "jobtitle",           value: data.nominee_role_title   ?? "" },
      { name: "state",              value: data.nominee_state        ?? "" },
      { name: "message",            value: data.reason },
      { name: "linkedin_url",       value: data.nominee_linkedin     ?? "" },
      { name: "nominator_name",     value: data.nominator_name },
      { name: "nominator_email",    value: data.nominator_email },
      { name: "nominator_phone",    value: data.nominator_phone      ?? "" },
      { name: "nominator_relation", value: data.nominator_relation   ?? "" },
    ],
    "Ambassador Nomination"
  );
}
