import { createClient } from "@/lib/supabase/server";
import PromptsClient, { type PromptTemplate } from "@/components/admin/PromptsClient";

export const dynamic = 'force-dynamic';

export default async function PromptsPage() {
  const sb = await createClient();
  const { data, error } = await sb
    .from("prompt_templates")
    .select("id, page_type, section_key, label, prompt, model, updated_at")
    .order("page_type")
    .order("section_key");

  const prompts: PromptTemplate[] = (data ?? []) as PromptTemplate[];

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Prompt Management</h1>
          <p className="swa-page-subtitle">
            Manage the AI prompts used to generate content for State and City/Area pages.
            Edit a prompt, then use the Re-generate button on a state or area edit page to apply it.
          </p>
        </div>
      </div>

      {error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>
          Could not load prompts: {error.message}.{" "}
          Make sure the <code>prompt_templates</code> table has been created and seeded in Supabase.
        </div>
      )}

      {prompts.length === 0 && !error && (
        <div className="swa-alert swa-alert--warning" style={{ marginBottom: 20 }}>
          No prompt templates found. Run <code>supabase/prompt_templates.sql</code> in your Supabase SQL editor to create and seed the table.
        </div>
      )}

      <PromptsClient initialPrompts={prompts} />
    </div>
  );
}
