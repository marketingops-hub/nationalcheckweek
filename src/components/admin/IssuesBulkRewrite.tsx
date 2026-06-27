"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

interface Issue {
  id: string;
  rank: number;
  slug: string;
  icon: string;
  title: string;
  severity: string;
  anchor_stat: string;
}

interface VaultDoc { id: string; title: string; kind: string }

interface Props {
  issues: Issue[];
}

const TONES = [
  { value: "professional", label: "Professional & authoritative" },
  { value: "accessible",   label: "Accessible & plain-language" },
  { value: "urgent",       label: "Urgent & compelling" },
  { value: "academic",     label: "Academic & evidence-based" },
];

const FIELDS = [
  { value: "short_desc",      label: "Short description" },
  { value: "definition",      label: "Definition" },
  { value: "australian_data", label: "Australian data" },
  { value: "mechanisms",      label: "Mechanisms (how it affects learning)" },
];

const SEVERITY_STYLE: Record<string, string> = {
  critical: "background:#FEF2F2;color:#DC2626;border:1px solid #FCA5A5",
  high:     "background:#FFFBEB;color:#D97706;border:1px solid #FDE68A",
  notable:  "background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0",
};

export default function IssuesBulkRewrite({ issues }: Props) {
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [tone, setTone]             = useState("professional");
  const [fields, setFields]         = useState<string[]>(["short_desc"]);
  const [running, setRunning]       = useState(false);
  const [results, setResults]       = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [showPanel, setShowPanel]   = useState(false);

  // Source document
  const [vaultDocs, setVaultDocs]         = useState<VaultDoc[]>([]);
  const [loadingVault, setLoadingVault]   = useState(false);
  const [vaultDocId, setVaultDocId]       = useState("");

  // Load vault docs when modal opens
  useEffect(() => {
    if (!showPanel) return;
    setLoadingVault(true);
    adminFetch("/api/admin/vault/documents?status=ready&limit=100")
      .then(r => r.json())
      .then(d => setVaultDocs((d.documents ?? d.items ?? []) as VaultDoc[]))
      .catch(() => {})
      .finally(() => setLoadingVault(false));
  }, [showPanel]);

  function toggleIssue(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll()   { setSelected(new Set(issues.map((i) => i.id))); }
  function selectNone()  { setSelected(new Set()); }

  function toggleField(f: string) {
    setFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function runRewrite() {
    if (!selected.size || !fields.length) return;
    setRunning(true);
    setResults({});

    const queue = issues.filter((i) => selected.has(i.id));
    const newResults: Record<string, { ok: boolean; msg: string }> = {};

    for (const issue of queue) {
      try {
        const res = await fetch("/api/admin/issues/bulk-rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: issue.id,
            fields,
            tone,
            ...(vaultDocId ? { vault_document_id: vaultDocId } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        newResults[issue.id] = { ok: true, msg: "✓ Rewritten" };
      } catch (e) {
        newResults[issue.id] = { ok: false, msg: e instanceof Error ? e.message : "Error" };
      }
      setResults({ ...newResults });
    }

    setRunning(false);
  }

  const selCount = selected.size;
  const selectedVault = vaultDocs.find(d => d.id === vaultDocId);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* BULK ACTION BAR */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "12px 16px", background: "#eef3f8",
        border: "1px solid #9fc9e6", borderRadius: 10, marginBottom: 16,
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="swa-btn swa-btn--ghost" onClick={selectAll} style={{ fontSize: "0.8rem" }}>
            Select all
          </button>
          <button className="swa-btn swa-btn--ghost" onClick={selectNone} style={{ fontSize: "0.8rem" }}>
            Clear
          </button>
        </div>

        {selCount > 0 && (
          <span style={{
            background: "#13b5ea", color: "#fff", borderRadius: 100,
            padding: "2px 10px", fontSize: "0.78rem", fontWeight: 700,
          }}>
            {selCount} selected
          </span>
        )}

        <div style={{ marginLeft: "auto" }}>
          <button
            className="swa-btn swa-btn--primary"
            disabled={selCount === 0}
            onClick={() => setShowPanel(true)}
            style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_fix_high</span>
            AI Rewrite {selCount > 0 ? `(${selCount})` : ""}
          </button>
        </div>
      </div>

      {/* ISSUE TABLE WITH CHECKBOXES */}
      <div className="swa-table-wrap">
        <table className="swa-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={selCount === issues.length && issues.length > 0}
                  onChange={(e) => e.target.checked ? selectAll() : selectNone()}
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th style={{ width: 48 }}>#</th>
              <th>Issue</th>
              <th>Severity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const status = results[issue.id];
              return (
                <tr
                  key={issue.id}
                  style={selected.has(issue.id) ? { background: "#F5F3FF" } : undefined}
                  onClick={() => toggleIssue(issue.id)}
                  className="swa-table__row--clickable"
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(issue.id)}
                      onChange={() => toggleIssue(issue.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#9CA3AF" }}>
                      {issue.rank}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "1.1rem" }}>{issue.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1b4673" }}>
                          {issue.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: 2 }}>
                          /issues/{issue.slug}
                        </div>
                      </div>
                      {status && (
                        <span style={{
                          marginLeft: 8, fontSize: "0.75rem", fontWeight: 600,
                          color: status.ok ? "#16A34A" : "#DC2626",
                        }}>
                          {status.msg}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 700, padding: "2px 10px",
                      borderRadius: 100, ...(Object.fromEntries(
                        (SEVERITY_STYLE[issue.severity] ?? "").split(";")
                          .filter(Boolean)
                          .map((s) => s.split(":").map((x) => x.trim()))
                      )),
                    }}>
                      {issue.severity}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <a
                        href={`/issues/${issue.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="swa-icon-btn"
                        title="View on site"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                      </a>
                      <a href={`/admin/issues/${issue.id}`} className="swa-icon-btn" title="Edit">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* REWRITE PANEL MODAL */}
      {showPanel && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !running) setShowPanel(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 16, padding: 32,
            maxWidth: 560, width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1b4673", marginBottom: 6 }}>
              AI Rewrite — {selCount} issue{selCount !== 1 ? "s" : ""}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
              Rewrite the selected fields for each chosen issue and save directly to the database.
              Original content will be overwritten.
            </p>

            {/* SOURCE DOCUMENT */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#13b5ea", marginBottom: 10 }}>
                Source document <span style={{ fontWeight: 400, textTransform: "none", color: "#9CA3AF" }}>(optional — AI will cite stats from this doc)</span>
              </div>
              {loadingVault ? (
                <p style={{ fontSize: "0.82rem", color: "#9CA3AF" }}>Loading vault…</p>
              ) : vaultDocs.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "#9CA3AF" }}>
                  No indexed documents in the Vault yet.{" "}
                  <a href="/admin/vault/upload" target="_blank" style={{ color: "#13b5ea" }}>Upload one →</a>
                </p>
              ) : (
                <select
                  value={vaultDocId}
                  onChange={e => setVaultDocId(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8,
                    border: vaultDocId ? "1.5px solid #13b5ea" : "1.5px solid #E5E7EB",
                    fontSize: "0.85rem", color: "#374151", background: "#fff",
                    outline: "none",
                  }}
                >
                  <option value="">— no document, use general AI knowledge —</option>
                  {vaultDocs.map(d => (
                    <option key={d.id} value={d.id}>{d.title} ({d.kind})</option>
                  ))}
                </select>
              )}
              {selectedVault && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: "#F5F3FF", borderRadius: 6, fontSize: "0.78rem", color: "#0fa0d2" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: "middle", marginRight: 4 }}>info</span>
                  Stats and claims from <strong>{selectedVault.title}</strong> will be cited inline as <em>(Source: {selectedVault.title})</em>
                </div>
              )}
            </div>

            {/* FIELDS */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#13b5ea", marginBottom: 10 }}>
                Fields to rewrite
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {FIELDS.map((f) => (
                  <label
                    key={f.value}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                      padding: "6px 12px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 500,
                      border: fields.includes(f.value) ? "1.5px solid #13b5ea" : "1.5px solid #E5E7EB",
                      background: fields.includes(f.value) ? "#F5F3FF" : "#fff",
                      color: fields.includes(f.value) ? "#0fa0d2" : "#374151",
                      transition: "all 0.12s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={fields.includes(f.value)}
                      onChange={() => toggleField(f.value)}
                      style={{ display: "none" }}
                    />
                    {fields.includes(f.value) ? "✓ " : ""}{f.label}
                  </label>
                ))}
              </div>
            </div>

            {/* TONE */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#13b5ea", marginBottom: 10 }}>
                Writing tone
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 500,
                      border: tone === t.value ? "1.5px solid #13b5ea" : "1.5px solid #E5E7EB",
                      background: tone === t.value ? "#F5F3FF" : "#fff",
                      color: tone === t.value ? "#0fa0d2" : "#374151",
                      cursor: "pointer", transition: "all 0.12s ease",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PROGRESS */}
            {running && (
              <div style={{
                background: "#F5F3FF", borderRadius: 8, padding: "12px 16px",
                marginBottom: 20, fontSize: "0.82rem", color: "#0fa0d2",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>progress_activity</span>
                  Processing {Object.keys(results).length} of {selCount}…
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPanel(false)}
                disabled={running}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "1px solid #E5E7EB",
                  background: "#F9FAFB", color: "#374151", fontSize: "0.875rem",
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await runRewrite();
                  setResults(prev => {
                    const hasErrors = Object.values(prev).some(r => !r.ok);
                    if (!hasErrors) setShowPanel(false);
                    return prev;
                  });
                }}
                disabled={running || fields.length === 0}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "none",
                  background: running ? "#7094b8" : "#13b5ea",
                  color: "#fff", fontSize: "0.875rem", fontWeight: 700,
                  cursor: running ? "not-allowed" : "pointer",
                }}
              >
                {running ? "Running…" : `Rewrite ${selCount} issue${selCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
