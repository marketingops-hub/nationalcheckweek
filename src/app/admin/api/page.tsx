import { createClient } from "@/lib/supabase/server";
import ApiKeysClient from "@/components/admin/ApiKeysClient";

export const dynamic = 'force-dynamic';

export default async function AdminApiPage() {
  const sb = await createClient();
  const { data: keys, error } = await sb
    .from("api_keys")
    .select("id, label, provider, key_value, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1>API Management</h1>
          <p>Add or remove API keys used for AI content generation and other integrations.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: 24 }}>
          <strong>Could not load API keys:</strong> {error.message}
          {error.message.includes("does not exist") && (
            <span> — Run the <code>api_keys.sql</code> migration in Supabase SQL Editor to create the table.</span>
          )}
        </div>
      )}

      <ApiKeysClient initialKeys={keys ?? []} />
    </div>
  );
}
