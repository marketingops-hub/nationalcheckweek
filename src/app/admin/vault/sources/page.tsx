import { createClient } from "@/lib/supabase/server";
import VaultSourcesClient from "@/components/admin/VaultSourcesClient";

export default async function VaultSourcesPage() {
  const sb = await createClient();
  const { data: sources, error } = await sb
    .from("vault_sources")
    .select("id, url, title, description, domain, category, is_approved, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#F0883E" }}>The Vault</span>
          <span style={{ color: "#30363D" }}>/</span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E7681" }}>Sources</span>
        </div>
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>Approved Sources</h1>
        <p className="text-sm" style={{ color: "#6E7681" }}>
          Pre-approved URLs that AI content generation is restricted to. OpenAI will only use these sources when creating or updating content — preventing hallucinated or uncited information.
        </p>
      </div>

      {error && (
        <div className="mt-6 px-4 py-3 rounded-lg text-sm" style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>
          Could not load sources: {error.message}. Make sure the <code>vault_sources</code> table has been created in Supabase.
        </div>
      )}

      {!error && <VaultSourcesClient initialSources={sources ?? []} />}
    </div>
  );
}
