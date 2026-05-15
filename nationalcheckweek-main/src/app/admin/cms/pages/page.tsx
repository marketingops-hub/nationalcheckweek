"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

const PAGE_SIZE = 20;

interface Page {
  id: string; slug: string; title: string; status: string; updated_at: string;
  /** Apr-2026: taxonomy column added by migration 20260422000003. Older
   *  rows come back as 'standard' via the DB default. */
  category?: 'standard' | 'geo';
  /** Only set on GEO rows; rendered as chips in the list. */
  area_slug?:  string | null;
  issue_slug?: string | null;
}

/** Tab filter for the category column. `null` = show everything. */
type CategoryTab = null | 'standard' | 'geo';

export default function CmsPagesPage() {
  const [pages, setPages]   = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab]   = useState<CategoryTab>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pages.filter(p => {
      // Treat missing category as 'standard' so pre-migration rows stay
      // visible under the All + Standard tabs.
      const cat = p.category ?? 'standard';
      if (tab && cat !== tab) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [pages, search, tab]);

  // Per-tab counts for the button badges. Computed off `pages` (not
  // `filtered`) so switching tabs doesn't make the counters bounce.
  const counts = useMemo(() => ({
    all:      pages.length,
    standard: pages.filter(p => (p.category ?? 'standard') === 'standard').length,
    geo:      pages.filter(p => p.category === 'geo').length,
  }), [pages]);

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

      {/* Category tabs + search. The tabs sit above the search input so
          the taxonomy is the primary filter and text narrows within it. */}
      {!loading && pages.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {([
              { key: null,      label: 'All',      count: counts.all },
              { key: 'standard', label: 'Standard', count: counts.standard },
              { key: 'geo',      label: 'GEO pages', count: counts.geo },
            ] as const).map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={String(t.key)}
                  type="button"
                  onClick={() => { setTab(t.key as CategoryTab); setPage(1); }}
                  className={`swa-btn ${active ? 'swa-btn--primary' : ''}`}
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  {t.label}
                  <span style={{
                    marginLeft: 6, fontSize: 11, opacity: 0.75,
                    padding: '1px 6px', borderRadius: 999,
                    background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.05)',
                  }}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
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
        </>
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
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)", display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {page.title}
                      {page.category === 'geo' && (
                        <span style={{
                          background: '#EEF2FF', color: '#3730A3',
                          fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                          padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                        }}>
                          GEO
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 2 }}>/{page.slug}</div>
                    {page.category === 'geo' && (page.area_slug || page.issue_slug) && (
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>
                        {page.area_slug && <span>area: <code>{page.area_slug}</code></span>}
                        {page.area_slug && page.issue_slug && <span> · </span>}
                        {page.issue_slug && <span>issue: <code>{page.issue_slug}</code></span>}
                      </div>
                    )}
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
