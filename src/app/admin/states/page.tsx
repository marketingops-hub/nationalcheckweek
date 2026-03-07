import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminStatesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let states: any[] | null = null;
  let fetchError = "";
  try {
    const sb = await createClient();
    const res = await sb
      .from("states")
      .select("id, slug, name, icon, subtitle, issues, updated_at")
      .order("name");
    states = res.data;
    if (res.error) fetchError = res.error.message;
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load states.";
  }

  const count = states?.length ?? 0;

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <div className="flex items-center gap-4">
          <h1>States & Territories</h1>
          <span className="admin-badge admin-badge-indigo">{count} records</span>
        </div>
        <Link href="/admin/states/new" className="admin-btn admin-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New State
        </Link>
      </div>

      {fetchError && (
        <div className="admin-alert admin-alert-error">{fetchError}</div>
      )}

      {(!states || states.length === 0) && !fetchError ? (
        <div className="admin-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <h3>No states or territories yet</h3>
          <p>Add your first state to start tracking wellbeing issues by region.</p>
          <Link href="/admin/states/new" className="admin-btn admin-btn-primary">Create a state</Link>
        </div>
      ) : states && states.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>State / Territory</th>
                <th className="hidden md:table-cell">Subtitle</th>
                <th>Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {states.map((state) => {
                const issueCount = Array.isArray(state.issues) ? state.issues.length : 0;
                return (
                  <tr key={state.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{state.icon}</span>
                        <div>
                          <div className="text-[15px] font-semibold" style={{ color: "var(--admin-text-primary)" }}>{state.name}</div>
                          <div className="text-xs mt-1" style={{ color: "var(--admin-text-faint)" }}>/states/{state.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="text-sm max-w-xs truncate" style={{ color: "var(--admin-text-muted)" }}>{state.subtitle}</div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-indigo">{issueCount} issues</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/states/${state.slug}`} target="_blank" className="admin-icon-btn" title="View on site">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </Link>
                        <Link href={`/admin/states/${state.id}`} className="admin-icon-btn" title="Edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
