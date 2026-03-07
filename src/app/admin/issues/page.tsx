import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const SEVERITY: Record<string, { css: string; label: string }> = {
  critical: { css: "admin-badge-red",    label: "Critical" },
  high:     { css: "admin-badge-yellow", label: "High" },
  notable:  { css: "admin-badge-green",  label: "Notable" },
};

export default async function AdminIssuesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let issues: any[] | null = null;
  let fetchError = "";
  try {
    const sb = await createClient();
    const res = await sb
      .from("issues")
      .select("id, rank, slug, icon, title, severity, anchor_stat, updated_at")
      .order("rank");
    issues = res.data;
    if (res.error) fetchError = res.error.message;
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load issues.";
  }

  const count = issues?.length ?? 0;

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <div className="flex items-center gap-4">
          <h1>Issues</h1>
          <span className="admin-badge admin-badge-indigo">{count} records</span>
        </div>
        <Link href="/admin/issues/new" className="admin-btn admin-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Issue
        </Link>
      </div>

      {fetchError && (
        <div className="admin-alert admin-alert-error">{fetchError}</div>
      )}

      {(!issues || issues.length === 0) && !fetchError ? (
        <div className="admin-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>No wellbeing issues yet</h3>
          <p>Create your first issue to start building the wellbeing database.</p>
          <Link href="/admin/issues/new" className="admin-btn admin-btn-primary">Create an issue</Link>
        </div>
      ) : issues && issues.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "48px" }}>#</th>
                <th>Issue</th>
                <th>Severity</th>
                <th className="hidden md:table-cell">Anchor Stat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => {
                const sev = SEVERITY[issue.severity] ?? SEVERITY.notable;
                return (
                  <tr key={issue.id}>
                    <td>
                      <span className="font-mono text-xs" style={{ color: "var(--admin-text-faint)" }}>{issue.rank}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{issue.icon}</span>
                        <div>
                          <div className="text-[15px] font-semibold" style={{ color: "var(--admin-text-primary)" }}>{issue.title}</div>
                          <div className="text-xs mt-1" style={{ color: "var(--admin-text-faint)" }}>/issues/{issue.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${sev.css}`}>{sev.label}</span>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="text-sm max-w-[260px] truncate" style={{ color: "var(--admin-text-muted)" }}>{issue.anchor_stat}</div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/issues/${issue.slug}`} target="_blank" className="admin-icon-btn" title="View on site">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </Link>
                        <Link href={`/admin/issues/${issue.id}`} className="admin-icon-btn" title="Edit">
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
