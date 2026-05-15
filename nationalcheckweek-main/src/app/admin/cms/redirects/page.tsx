import { createClient } from "@/lib/supabase/server";
import RedirectsClient from "@/components/admin/RedirectsClient";

export const dynamic = "force-dynamic";

export default async function RedirectsPage() {
  const sb = await createClient();
  const { data, error } = await sb
    .from("redirects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Redirect Manager</h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-subtle)" }}>Manage 301/302 redirects. Served by the middleware — take effect immediately, no redeploy needed.</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-lg px-4 py-3 mb-6 flex items-start gap-3" style={{ background: 'var(--admin-accent-bg)', border: '1px solid rgba(89,37,244,0.15)' }}>
        <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5925f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
          <strong style={{ color: 'var(--admin-accent)' }}>How it works:</strong> The Next.js middleware checks every incoming request against active redirects in this table.
          Use <strong style={{ color: 'var(--admin-text-primary)' }}>301</strong> for permanent moves (search engines transfer link equity) and <strong style={{ color: 'var(--admin-text-primary)' }}>302</strong> for temporary ones.
          Pausing a redirect keeps it in the database but disables it without deleting it.
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">Could not load redirects: {error.message}</div>
      )}

      <RedirectsClient initial={data ?? []} />
    </div>
  );
}
