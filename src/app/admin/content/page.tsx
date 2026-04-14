"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

const PAGE_SIZE = 50;

interface Area {
  id: string; slug: string; name: string; state: string;
  type: string; issues: unknown; updated_at: string;
  seo_title?: string;
}

export default function AdminContentPage() {
  const [areas, setAreas]   = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch]   = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminFetch('/api/admin/areas')
      .then((r) => r.json())
      .then((d) => {
        setAreas((d.areas ?? []) as Area[]);
        setLoading(false);
      })
      .catch((e) => {
        setFetchError(e.message);
        setLoading(false);
      });
  }, []);

  const states = useMemo(() =>
    ["all", ...Array.from(new Set(areas.map(a => a.state))).sort()],
  [areas]);

  const filtered = useMemo(() => areas.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      a.state.toLowerCase().includes(search.toLowerCase());
    const matchState = stateFilter === "all" || a.state === stateFilter;
    return matchSearch && matchState;
  }), [areas, search, stateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const resetPage = useCallback(() => setPage(1), []);

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Areas</h1>
          <p className="swa-page-subtitle">
            {loading ? "Loading…" : `${areas.length} cities, regions and LGAs`}
          </p>
        </div>
        <Link href="/admin/content/new" className="swa-btn swa-btn--primary" style={{ textDecoration: "none" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Area
        </Link>
      </div>

      {fetchError && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>{fetchError}</div>
      )}

      {/* Filters row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
          <span className="material-symbols-outlined" style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 17, color: "#9CA3AF", pointerEvents: "none",
          }}>search</span>
          <input
            type="search"
            placeholder="Search areas…"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            className="swa-form-input"
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* State filter */}
        <select
          value={stateFilter}
          onChange={e => { setStateFilter(e.target.value); resetPage(); }}
          className="swa-form-input"
          style={{ width: "auto", minWidth: 180 }}
        >
          {states.map(s => (
            <option key={s} value={s}>
              {s === "all" ? "All states" : s}
            </option>
          ))}
        </select>

        <span style={{ fontSize: 12, color: "var(--color-text-faint)", marginLeft: "auto" }}>
          {loading ? "Loading…" : `${filtered.length} of ${areas.length}`}
        </span>
      </div>

      {/* Table */}
      <div className="swa-card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="swa-table" style={{ minWidth: 860 }}>
          <thead>
            <tr>
              <th>Area</th>
              <th>State</th>
              <th>Type</th>
              <th>Issues</th>
              <th>SEO</th>
              <th>Updated</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--color-text-faint)" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--color-text-faint)" }}>
                  No areas match your filters.
                </td>
              </tr>
            )}
            {paginated.map((area) => {
              const issueCount = Array.isArray(area.issues) ? area.issues.length : 0;
              const typeLabel = area.type === "city" ? "City" : area.type === "lga" ? "LGA" : "Region";
              const typeBadge = area.type === "city" ? "swa-badge--warning"
                : area.type === "lga" ? "swa-badge--primary" : "swa-badge--info";
              const hasSeo = !!(area.seo_title?.trim());
              const updatedDate = area.updated_at
                ? new Date(area.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                : "—";
              return (
                <tr key={area.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{area.name}</span>
                    <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 2 }}>/areas/{area.slug}</div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--color-text-body)" }}>{area.state}</td>
                  <td><span className={`swa-badge ${typeBadge}`}>{typeLabel}</span></td>
                  <td><span className="swa-badge swa-badge--info">{issueCount}</span></td>
                  <td>
                    {hasSeo
                      ? <span className="swa-badge swa-badge--success">✓ Set</span>
                      : <Link href="/admin/seo" className="swa-badge" style={{ background: "#FEF3C7", color: "#D97706", textDecoration: "none", fontSize: 11 }}>Missing</Link>
                    }
                  </td>
                  <td style={{ fontSize: 12, color: "var(--color-text-faint)" }}>{updatedDate}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                      <Link href={`/areas/${area.slug}`} target="_blank" className="swa-btn swa-btn--ghost"
                        style={{ fontSize: 12, padding: "5px 10px", textDecoration: "none" }}>
                        View ↗
                      </Link>
                      <Link href={`/admin/content/${area.id}`} className="swa-btn swa-btn--primary"
                        style={{ fontSize: 12, padding: "5px 12px", textDecoration: "none" }}>
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {!loading && totalPages > 1 && (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>{filtered.length} areas · page {page} of {totalPages}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="swa-icon-btn" style={{ opacity: page === 1 ? 0.4 : 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="swa-icon-btn" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
