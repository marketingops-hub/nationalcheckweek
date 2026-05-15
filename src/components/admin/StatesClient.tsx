"use client";

import { useState } from "react";
import Link from "next/link";

interface StateRow {
  id: string;
  slug: string;
  name: string;
  icon: string;
  subtitle: string | null;
  issues: string[] | null;
  updated_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function StatesClient({ states }: { states: StateRow[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const totalIssues = states.reduce(
    (sum, s) => sum + (Array.isArray(s.issues) ? s.issues.length : 0),
    0
  );
  const maxIssues = Math.max(
    ...states.map((s) => (Array.isArray(s.issues) ? s.issues.length : 0)),
    1
  );
  const withIssues = states.filter(
    (s) => Array.isArray(s.issues) && s.issues.length > 0
  ).length;
  const coveragePct =
    states.length > 0 ? Math.round((withIssues / states.length) * 100) : 0;

  const filtered = states.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="swa-stat-grid" style={{ marginBottom: 24 }}>
        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">Total States</span>
            <span className="swa-badge swa-badge--primary">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 12 }}
              >
                public
              </span>
              All
            </span>
          </div>
          <div className="swa-stat-card__value">{states.length}</div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">
              States &amp; territories
            </span>
          </div>
        </div>

        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">Total Issues</span>
            <span className="swa-badge swa-badge--success">Tracked</span>
          </div>
          <div className="swa-stat-card__value">{totalIssues}</div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">Across all states</span>
          </div>
        </div>

        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">Issue Coverage</span>
            <span
              className={`swa-badge ${coveragePct === 100 ? "swa-badge--success" : "swa-badge--warning"}`}
            >
              {coveragePct === 100 ? "Complete" : "Partial"}
            </span>
          </div>
          <div className="swa-stat-card__value">{coveragePct}%</div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">
              {withIssues}/{states.length} states have issues
            </span>
          </div>
        </div>
      </div>

      {/* Search + Bulk Actions Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <input
          className="swa-search"
          placeholder="Search states…"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selected.size > 0 && (
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                marginRight: 4,
              }}
            >
              {selected.size} selected
            </span>
          )}
          <span
            style={{ fontSize: 13, color: "var(--color-text-faint)" }}
          >
            {filtered.length} of {states.length} states
          </span>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="swa-card"
          style={{ textAlign: "center", padding: "48px 24px" }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 48,
              color: "var(--color-text-faint)",
              marginBottom: 12,
              display: "block",
            }}
          >
            search_off
          </span>
          <div
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: 4,
            }}
          >
            No states found
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {search
              ? `No results for "${search}"`
              : "Add your first state to start tracking wellbeing issues."}
          </div>
          {!search && (
            <Link
              href="/admin/states/new"
              className="swa-btn swa-btn--primary"
              style={{ marginTop: 16, display: "inline-flex", textDecoration: "none" }}
            >
              Create a state
            </Link>
          )}
        </div>
      ) : (
        <div
          className="swa-card"
          style={{ padding: 0, overflowX: "auto" }}
        >
          <table className="swa-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ width: 40, paddingRight: 0 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>State / Territory</th>
                <th>Subtitle</th>
                <th>Issues</th>
                <th>Coverage</th>
                <th>Last Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((state) => {
                const issueCount = Array.isArray(state.issues)
                  ? state.issues.length
                  : 0;
                const pct = Math.round((issueCount / maxIssues) * 100);
                const barColor =
                  issueCount === 0
                    ? "var(--color-border)"
                    : pct >= 80
                      ? "var(--color-success)"
                      : pct >= 40
                        ? "var(--color-primary)"
                        : "var(--color-warning)";

                return (
                  <tr key={state.id}>
                    <td style={{ paddingRight: 0 }}>
                      <input
                        type="checkbox"
                        checked={selected.has(state.id)}
                        onChange={() => toggleOne(state.id)}
                        aria-label={`Select ${state.name}`}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-primary-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          {state.icon || "🏛️"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {state.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--color-text-faint)",
                              marginTop: 1,
                            }}
                          >
                            /states/{state.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--color-text-muted)",
                          maxWidth: 200,
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {state.subtitle || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="swa-badge swa-badge--primary">
                        {issueCount} issues
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 120,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            borderRadius: "var(--radius-full)",
                            background: "var(--color-border-light)",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              height: "100%",
                              width: `${pct}%`,
                              borderRadius: "var(--radius-full)",
                              background: barColor,
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: barColor,
                            minWidth: 32,
                            textAlign: "right",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-faint)",
                        }}
                      >
                        {state.updated_at ? timeAgo(state.updated_at) : "—"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 6,
                        }}
                      >
                        <Link
                          href={`/states/${state.slug}`}
                          target="_blank"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "5px 10px",
                            borderRadius: "var(--radius-sm)",
                            textDecoration: "none",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-muted)",
                            background: "var(--color-card)",
                          }}
                        >
                          View ↗
                        </Link>
                        <Link
                          href={`/admin/states/${state.id}`}
                          className="swa-btn swa-btn--primary"
                          style={{
                            fontSize: 12,
                            padding: "5px 12px",
                            textDecoration: "none",
                          }}
                        >
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
      )}
    </div>
  );
}
