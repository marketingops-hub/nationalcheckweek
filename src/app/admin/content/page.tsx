import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TYPE_BADGE: Record<string, { css: string; label: string }> = {
  city:   { css: "admin-badge-yellow", label: "City" },
  lga:    { css: "admin-badge-indigo", label: "LGA" },
  region: { css: "admin-badge-green",  label: "Region" },
};

export default async function AdminContentPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let areas: any[] | null = null;
  let fetchError = "";
  try {
    const sb = await createClient();
    const res = await sb
      .from("areas")
      .select("id, slug, name, state, type, issues, updated_at")
      .order("state")
      .order("name");
    areas = res.data;
    if (res.error) fetchError = res.error.message;
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load areas.";
  }

  const count = areas?.length ?? 0;

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <div className="flex items-center gap-4">
          <h1>Areas</h1>
          <span className="admin-badge admin-badge-indigo">{count} records</span>
        </div>
        <Link href="/admin/content/new" className="admin-btn admin-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Area
        </Link>
      </div>

      {fetchError && (
        <div className="admin-alert admin-alert-error">{fetchError}</div>
      )}

      {(!areas || areas.length === 0) && !fetchError ? (
        <div className="admin-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <h3>No areas yet</h3>
          <p>Add your first city, region, or LGA to start building area reports.</p>
          <Link href="/admin/content/new" className="admin-btn admin-btn-primary">Create an area</Link>
        </div>
      ) : areas && areas.length > 0 ? (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--admin-border)" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Area</th>
                <th className="hidden md:table-cell">State</th>
                <th>Type</th>
                <th>Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => {
                const issueCount = Array.isArray(area.issues) ? area.issues.length : 0;
                const typeBadge = TYPE_BADGE[area.type] ?? TYPE_BADGE.region;
                return (
                  <tr key={area.id}>
                    <td>
                      <div className="text-[15px] font-semibold" style={{ color: "var(--admin-text-primary)" }}>{area.name}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--admin-text-faint)" }}>/areas/{area.slug}</div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{area.state}</span>
                    </td>
                    <td>
                      <span className={`admin-badge ${typeBadge.css}`}>{typeBadge.label}</span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-indigo">{issueCount}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/areas/${area.slug}`} target="_blank" className="admin-icon-btn" title="View on site">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </Link>
                        <Link href={`/admin/content/${area.id}`} className="admin-icon-btn" title="Edit">
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
