import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CmsPagesPage() {
  const sb = await createClient();
  const { data: pages } = await sb
    .from("pages")
    .select("id, slug, title, description, status, show_in_menu, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="admin-page-header">
        <div className="flex items-center gap-4">
          <h1>CMS Pages</h1>
          <span className="admin-badge admin-badge-indigo">{pages?.length ?? 0} records</span>
        </div>
        <Link href="/admin/cms/pages/new" className="admin-btn admin-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Page
        </Link>
      </div>

      {(!pages || pages.length === 0) ? (
        <div className="admin-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <h3>No pages yet</h3>
          <p>Create your first page and add it to the front-end menu.</p>
          <Link href="/admin/cms/pages/new" className="admin-btn admin-btn-primary">Create a page</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th className="hidden md:table-cell">In Menu</th>
                <th className="hidden md:table-cell">Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <div className="text-[15px] font-semibold" style={{ color: "var(--admin-text-primary)" }}>{page.title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--admin-text-faint)" }}>/{page.slug}</div>
                  </td>
                  <td>
                    <span className={`admin-badge ${page.status === "published" ? "admin-badge-green" : "admin-badge-slate"}`}>
                      {page.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className={`admin-badge ${page.show_in_menu ? "admin-badge-indigo" : "admin-badge-slate"}`}>
                      {page.show_in_menu ? "In menu" : "Hidden"}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                      {new Date(page.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {page.status === "published" && (
                        <Link href={`/pages/${page.slug}`} target="_blank" className="admin-icon-btn" title="View on site">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </Link>
                      )}
                      <Link href={`/admin/cms/pages/${page.id}`} className="admin-icon-btn" title="Edit">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
