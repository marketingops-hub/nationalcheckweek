import { createClient } from "@/lib/supabase/server";
import VaultSourcesClient from "@/components/admin/VaultSourcesClient";
import VaultContentClient from "@/components/admin/VaultContentClient";
import VaultTabs from "@/components/admin/VaultTabs";

export const dynamic = 'force-dynamic';

export default async function VaultSourcesPage() {
  const sb = await createClient();

  const { data: sources, error: srcErr } = await sb
    .from("vault_sources")
    .select("id, url, title, description, domain, category, is_approved, created_at")
    .order("created_at", { ascending: false });

  const { data: content, error: cntErr } = await sb
    .from("vault_content")
    .select("id, title, content, source, category, is_approved, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1>The Vault</h1>
          <p>Approved sources and verified content blocks used by AI content generation.</p>
        </div>
      </div>

      {srcErr && (
        <div className="admin-alert admin-alert-error">
          Could not load sources: {srcErr.message}. Make sure the <code>vault_sources</code> table has been created in Supabase.
        </div>
      )}

      {cntErr && !cntErr.message.includes("does not exist") && (
        <div className="admin-alert admin-alert-error">
          Could not load content blocks: {cntErr.message}.
        </div>
      )}

      <VaultTabs
        sourcesContent={<VaultSourcesClient initialSources={sources ?? []} />}
        blocksContent={
          cntErr?.message.includes("does not exist")
            ? <div className="admin-alert admin-alert-warning">The <code>vault_content</code> table does not exist yet. Run the SQL from <code>supabase/vault_content.sql</code> in your Supabase SQL Editor to enable content blocks.</div>
            : <VaultContentClient initialContent={content ?? []} />
        }
        sourceCount={sources?.length ?? 0}
        blockCount={content?.length ?? 0}
      />
    </div>
  );
}
