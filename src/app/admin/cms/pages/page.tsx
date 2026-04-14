"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

const PAGE_SIZE = 20;

interface Page {
  id: string; slug: string; title: string; status: string; updated_at: string;
}

export default function CmsPagesPage() {
  const [pages, setPages]   = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? pages : pages.filter(p =>
      p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [pages, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchPages = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/pages");
      const d = await res.json();
      setPages(Array.isArray(d) ? d : (d.pages ?? []));
    } catch (err) { 
      setError(err instanceof Error ? err.message : "Failed to load pages."); 
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  async function deletePage(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const prev = pages;
    setPages(p => p.filter(x => x.id !== id));
    try {
      const res = await adminFetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      if (!res.ok) { setPages(prev); setError("Failed to delete page."); }
    } catch (err) {
      setPages(prev);
      setError(err instanceof Error ? err.message : "Failed to delete page.");
    }
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">CMS Pages</h1>
          <p className="swa-page-subtitle">
            {loading ? "Loading…" : `${pages.length} page${pages.length !== 1 ? "s" : ""}`} · static content pages
          </p>
        </div>
        <Link href="/admin/cms/pages/new" className="swa-btn swa-btn--primary" style={{ textDecoration: "none" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Page
        </Link>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Search */}
      {!loading && pages.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: '#9CA3AF', pointerEvents: 'none' }}>search</span>
            <input type="search" placeholder="Search pages…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="swa-form-input" style={{ paddingLeft: 36 }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-faint)', marginLeft: 'auto' }}>
            {filtered.length} of {pages.length}
          </span>
        </div>
      )}

      {!loading && pages.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px", color: "#9CA3AF" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 16 }}>article</span>
          <h3 style={{ color: "#1E1040", marginBottom: 8 }}>No pages yet</h3>
          <p style={{ marginBottom: 20 }}>Create your first CMS page to add it to the site.</p>
          <Link href="/admin/cms/pages/new" className="swa-btn swa-btn--primary" style={{ textDecoration: "none" }}>Create a page</Link>
        </div>
      ) : (
        <div className="swa-card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="swa-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && search && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-faint)' }}>No pages match your search.</td></tr>
              )}
              {paginated.map((page) => (
                <tr key={page.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{page.title}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 2 }}>/{page.slug}</div>
                  </td>
                  <td>
                    <span className={`swa-badge ${page.status === "published" ? "swa-badge--success" : "swa-badge--primary"}`}>
                      {page.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--color-text-faint)" }}>
                    {new Date(page.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                      {page.status === "published" && (
                        <Link href={`/pages/${page.slug}`} target="_blank" className="swa-icon-btn" title="View on site">
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>open_in_new</span>
                        </Link>
                      )}
                      <Link href={`/admin/cms/pages/${page.id}`} className="swa-icon-btn" title="Edit">
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                      </Link>
                      <button onClick={() => deletePage(page.id, page.title)} className="swa-icon-btn" title="Delete"
                        style={{ color: "#EF4444" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination footer */}
      {!loading && totalPages > 1 && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="swa-icon-btn" style={{ opacity: page === 1 ? 0.4 : 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
          </button>
          <span style={{ fontSize: 12, color: 'var(--color-text-faint)', minWidth: 60, textAlign: 'center' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="swa-icon-btn" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
