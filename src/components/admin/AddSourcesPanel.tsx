"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/adminFetch";

export interface FoundSource {
  id: string;
  title: string;
  label: string;
  url: string | null;
  year: string | null;
  cited: boolean;
  snippets: string[];
}

interface Props {
  /** ids already in the sources list */
  existingIds: Set<string>;
  onAdd: (source: FoundSource) => void;
  disabled?: boolean;
}

/** Search the vault for more documents and add them to the sources list. */
export default function AddSourcesPanel({ existingIds, onAdd, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundSource[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    const q = query.trim();
    if (q.length < 3) {
      setError("Type at least 3 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/page-refresh/search?q=${encodeURIComponent(q)}`, { timeout: 60_000 });
      const d = await res.json();
      setResults((d.results ?? []) as FoundSource[]);
    } catch (e) {
      setResults(null);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1px dashed var(--admin-border)" }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Add more sources from the vault</div>
      <div style={{ fontSize: 12, color: "var(--admin-text-subtle)", marginBottom: 8 }}>
        Search by topic, a statistic or a document title. Added sources are ticked automatically and used the next time you re-run verification.
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={query}
          disabled={disabled || busy}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="e.g. cyberbullying eSafety 2025"
          aria-label="Search the vault"
          className="swa-form-input"
          style={{ flex: "1 1 260px", fontSize: 13 }}
        />
        <button type="button" className="admin-btn admin-btn-secondary" onClick={search} disabled={disabled || busy}>
          {busy ? "Searching…" : "Search vault"}
        </button>
      </div>

      {error && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 6 }}>{error}</div>}

      {results && results.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--admin-text-subtle)", marginTop: 8 }}>
          No indexed documents matched. Check the document shows as Ready in the vault library.
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {results.map((r) => {
            const have = existingIds.has(r.id);
            return (
              <div key={r.id} style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "flex-start", padding: "8px 10px", border: "1px solid var(--admin-border)", borderRadius: 6 }}>
                <div style={{ fontSize: 13, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: r.url ? "#15803d" : "#b45309" }}>{r.url ? "Has a public link" : "No public link yet"}</div>
                  {r.snippets.slice(0, 2).map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--admin-text-subtle)", marginTop: 4, lineHeight: 1.4 }}>
                      “{s.length > 240 ? `${s.slice(0, 240)}…` : s}”
                    </div>
                  ))}
                </div>
                <button type="button" className="admin-btn admin-btn-secondary text-xs" disabled={have || disabled} onClick={() => onAdd(r)} style={{ flex: "none" }}>
                  {have ? "Already added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
