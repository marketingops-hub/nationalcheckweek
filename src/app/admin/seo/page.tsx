"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type TableKey = "events" | "areas" | "issues" | "states";

interface Row {
  id: string;
  label: string;
  seo_title: string;
  seo_desc: string;
  selected: boolean;
  status: "idle" | "generating" | "done" | "error";
}

const TABLE_CONFIG: Record<TableKey, { label: string; select: string; labelField: string }> = {
  events: { label: "Events",  select: "id, title, seo_title, seo_desc", labelField: "title" },
  areas:  { label: "Areas",   select: "id, name, seo_title, seo_desc",  labelField: "name"  },
  issues: { label: "Issues",  select: "id, title, seo_title, seo_desc", labelField: "title" },
  states: { label: "States",  select: "id, name, seo_title, seo_desc",  labelField: "name"  },
};

function charColor(len: number, max: number): string {
  if (len === 0) return "var(--color-text-faint)";
  if (len > max) return "#EF4444";
  if (len > max * 0.9) return "#F59E0B";
  return "#10B981";
}

const MISSING_ONLY_LABEL = "Missing SEO only";

export default function AdminSeoPage() {
  const [table, setTable]           = useState<TableKey>("events");
  const [rows, setRows]             = useState<Row[]>([]);
  const [loading, setLoading]       = useState(false);
  const [missingOnly, setMissing]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress]     = useState<{ done: number; total: number } | null>(null);
  const [error, setError]           = useState("");

  // Load rows whenever table or filter changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setRows([]);
      setError("");
      const sb = createClient();
      const cfg = TABLE_CONFIG[table];
      let query = sb.from(table).select(cfg.select).order("id");
      if (missingOnly) query = query.or("seo_title.is.null,seo_title.eq.,seo_desc.is.null,seo_desc.eq.");
      const { data, error: err } = await query.limit(200);
      if (cancelled) return;
      if (err) { setError(err.message); setLoading(false); return; }
      const d = ((data ?? []) as unknown) as Record<string, string>[];
      setRows(d.map((r) => ({
        id: r.id,
        label: r[cfg.labelField] ?? r.id,
        seo_title: r.seo_title ?? "",
        seo_desc: r.seo_desc ?? "",
        selected: true,
        status: "idle",
      })));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [table, missingOnly]);

  function toggleAll(val: boolean) {
    setRows((rs) => rs.map((r) => ({ ...r, selected: val })));
  }

  function toggleRow(id: string) {
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, selected: !r.selected } : r));
  }

  async function runGenerate() {
    const selected = rows.filter((r) => r.selected);
    if (!selected.length) return;
    setGenerating(true);
    setProgress({ done: 0, total: selected.length });
    setError("");

    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;
    if (!token) { setError("Not authenticated"); setGenerating(false); return; }

    // Process in batches of 5 to avoid timeouts
    const BATCH = 5;
    let done = 0;
    for (let i = 0; i < selected.length; i += BATCH) {
      const batch = selected.slice(i, i + BATCH);
      // Mark as generating
      setRows((rs) => rs.map((r) =>
        batch.some((b) => b.id === r.id) ? { ...r, status: "generating" } : r
      ));

      const res = await fetch("/api/admin/seo-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ table, ids: batch.map((b) => b.id) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(err.error ?? "Generation failed");
        setRows((rs) => rs.map((r) =>
          batch.some((b) => b.id === r.id) ? { ...r, status: "error" } : r
        ));
      } else {
        const { results } = await res.json() as {
          results: { id: string; seo_title: string; seo_desc: string }[]
        };
        setRows((rs) => rs.map((r) => {
          const hit = results.find((x) => x.id === r.id);
          if (!hit) return r;
          return { ...r, seo_title: hit.seo_title, seo_desc: hit.seo_desc, status: "done" };
        }));
      }

      done += batch.length;
      setProgress({ done, total: selected.length });
    }

    setGenerating(false);
    setProgress(null);
  }

  const selectedCount = rows.filter((r) => r.selected).length;
  const allSelected   = rows.length > 0 && rows.every((r) => r.selected);

  return (
    <div>
      {/* Page header */}
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">SEO Manager</h1>
          <p className="swa-page-subtitle">
            Mass-generate SEO titles and descriptions using AI — across events, areas and issues
          </p>
        </div>
        <button
          className="swa-btn swa-btn--primary"
          onClick={runGenerate}
          disabled={generating || selectedCount === 0}
        >
          {generating && progress
            ? `Generating… ${progress.done}/${progress.total}`
            : `✨ Generate SEO for ${selectedCount} record${selectedCount !== 1 ? "s" : ""}`
          }
        </button>
      </div>

      {error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        {/* Table selector */}
        <div style={{ display: "flex", gap: 2, background: "#F3F4F6", padding: 4, borderRadius: 10 }}>
          {(Object.keys(TABLE_CONFIG) as TableKey[]).map((t) => (
            <button
              key={t}
              onClick={() => setTable(t)}
              className="swa-btn"
              style={{
                padding: "6px 16px", fontSize: 13, borderRadius: 8,
                background: table === t ? "#fff" : "transparent",
                color: table === t ? "var(--color-primary)" : "var(--color-text-muted)",
                fontWeight: table === t ? 700 : 500,
                boxShadow: table === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {TABLE_CONFIG[t].label}
            </button>
          ))}
        </div>

        {/* Missing only toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
          <button
            type="button"
            role="switch"
            aria-checked={missingOnly}
            onClick={() => setMissing((v) => !v)}
            className={`swa-toggle${missingOnly ? " on" : ""}`}
          />
          {MISSING_ONLY_LABEL}
        </label>

        <span style={{ fontSize: 12, color: "var(--color-text-faint)", marginLeft: "auto" }}>
          {loading ? "Loading…" : `${rows.length} record${rows.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Progress bar */}
      {generating && progress && (
        <div style={{ marginBottom: 16, background: "#F3F4F6", borderRadius: 8, overflow: "hidden", height: 6 }}>
          <div style={{
            height: "100%", background: "var(--color-primary)",
            width: `${(progress.done / progress.total) * 100}%`,
            transition: "width 0.3s ease",
            borderRadius: 8,
          }} />
        </div>
      )}

      {/* Table */}
      <div className="swa-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="swa-table" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "30%" }} />
            <col />
            <col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ padding: "12px 16px" }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th>Record</th>
              <th>SEO Title <span style={{ fontWeight: 400, color: 'var(--color-text-faint)', fontSize: 11 }}>(max 60)</span></th>
              <th>SEO Description <span style={{ fontWeight: 400, color: 'var(--color-text-faint)', fontSize: 11 }}>(max 160)</span></th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px 16px", color: "var(--color-text-faint)" }}>
                  Loading records…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px 16px", color: "var(--color-text-faint)" }}>
                  {missingOnly ? "All records have SEO metadata — great work! 🎉" : "No records found."}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} style={{ opacity: row.status === "generating" ? 0.6 : 1 }}>
                <td style={{ padding: "12px 16px" }}>
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => toggleRow(row.id)}
                    style={{ cursor: "pointer" }}
                    disabled={generating}
                  />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.label}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {row.seo_title ? (
                    <>
                      <span style={{ fontSize: 12, color: "var(--color-text-body)", display: "block" }}>{row.seo_title}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: charColor(row.seo_title.length, 60) }}>
                        {row.seo_title.length}/60
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--color-text-faint)", fontStyle: "italic" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {row.seo_desc ? (
                    <>
                      <span style={{ fontSize: 12, color: "var(--color-text-body)", display: "block" }}>{row.seo_desc}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: charColor(row.seo_desc.length, 160) }}>
                        {row.seo_desc.length}/160
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--color-text-faint)", fontStyle: "italic" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {row.status === "idle" && (
                    <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>—</span>
                  )}
                  {row.status === "generating" && (
                    <span style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 600 }}>⏳</span>
                  )}
                  {row.status === "done" && (
                    <span style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 700 }}>✓ Done</span>
                  )}
                  {row.status === "error" && (
                    <span style={{ fontSize: 11, color: "var(--color-error)", fontWeight: 700 }}>✗ Error</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
