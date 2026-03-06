import { createClient } from "@/lib/supabase/server";
import ApiKeysClient from "@/components/admin/ApiKeysClient";

export default async function AdminApiPage() {
  const sb = await createClient();
  const { data: keys } = await sb
    .from("api_keys")
    .select("id, label, provider, key_value, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>API Management</h1>
        <p className="text-sm" style={{ color: "#6E7681" }}>
          Add or remove API keys used for AI content generation and other integrations.
        </p>
      </div>
      <ApiKeysClient initialKeys={keys ?? []} />
    </div>
  );
}
