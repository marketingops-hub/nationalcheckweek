"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { DangerConfirm, fmtDate, getDomainFromUrl, type AdminVaultSource } from "@/components/admin/ui";
import VaultAddForm from "@/components/admin/VaultAddForm";
import VaultEditForm from "@/components/admin/VaultEditForm";

const CATEGORIES = ["general", "mental health", "education", "government", "research", "statistics", "other"];

export default function VaultSourcesClient({ initialSources }: { initialSources: AdminVaultSource[] }) {
  const [sources, setSources]               = useState<AdminVaultSource[]>(initialSources);
  const [search, setSearch]                 = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterApproved, setFilterApproved] = useState("all");
  const [showAdd, setShowAdd]               = useState(false);
  const [editSource, setEditSource]         = useState<AdminVaultSource | null>(null);
  const [busy, setBusy]                     = useState(false);
  const [error, setError]                   = useState("");
  const [success, setSuccess]               = useState("");
  const [confirmDelete, setConfirmDelete]   = useState<string | null>(null);

  function clearMessages() { setError(""); setSuccess(""); }

  const filtered = useMemo(() => sources.filter(s => {
    const matchSearch   = !search || s.url.includes(search) || s.title.toLowerCase().includes(search.toLowerCase()) || s.domain.includes(search);
    const matchCat      = filterCategory === "all" || s.category === filterCategory;
    const matchApproved = filterApproved === "all" || (filterApproved === "approved" ? s.is_approved : !s.is_approved);
    return matchSearch && matchCat && matchApproved;
  }), [sources, search, filterCategory, filterApproved]);

  const approvedCount = sources.filter(s => s.is_approved).length;

  async function handleAdd({ url, title, description, category }: { url: string; title: string; description: string; category: string }) {
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { data, error: err } = await sb
        .from("vault_sources")
        .insert({ url, title: title || getDomainFromUrl(url), description, category, is_approved: true })
        .select().single();
      if (err) { setError(err.code === "23505" ? "This URL is already in the vault." : err.message); return; }
      setSources(s => [data, ...s]);
      setSuccess(`Source added: ${data.domain}`);
      setShowAdd(false);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit({ title, description, category }: { title: string; description: string; category: string }) {
    if (!editSource) return;
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { error: err } = await sb.from("vault_sources").update({ title, description, category }).eq("id", editSource.id);
      if (err) { setError(err.message); return; }
      setSources(s => s.map(s2 => s2.id === editSource.id ? { ...s2, title, description, category } : s2));
      setSuccess("Source updated.");
      setEditSource(null);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleApproved(source: AdminVaultSource) {
    const sb = createClient();
    const { error: err } = await sb.from("vault_sources").update({ is_approved: !source.is_approved }).eq("id", source.id);
    if (err) { setError(err.message); return; }
    setSources(s => s.map(s2 => s2.id === source.id ? { ...s2, is_approved: !s2.is_approved } : s2));
  }

  async function handleDelete(source: AdminVaultSource) {
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { error: err } = await sb.from("vault_sources").delete().eq("id", source.id);
      if (err) { setError(err.message); return; }
      setSources(s => s.filter(s2 => s2.id !== source.id));
      setSuccess("Source removed from vault.");
      setConfirmDelete(null);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="admin-card" style={{ padding: "20px 24px" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--admin-accent)" }}>{sources.length}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--admin-text-subtle)" }}>Total Sources</div>
        </div>
        <div className="admin-card" style={{ padding: "20px 24px" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--admin-success)" }}>{approvedCount}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--admin-text-subtle)" }}>Approved</div>
        </div>
        <div className="admin-card" style={{ padding: "20px 24px" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--admin-danger)" }}>{sources.length - approvedCount}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--admin-text-subtle)" }}>Suspended</div>
        </div>
      </div>

      {/* Feedback */}
      {!showAdd && !editSource && error   && <div className="admin-alert admin-alert-error"   role="alert">{error}</div>}
      {!showAdd && !editSource && success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* Add form */}
      {showAdd && (
        <VaultAddForm
          busy={busy}
          error={error}
          onSubmit={handleAdd}
          onClose={() => { setShowAdd(false); clearMessages(); }}
        />
      )}

      {/* Edit form */}
      {editSource && (
        <VaultEditForm
          source={editSource}
          busy={busy}
          error={error}
          onSubmit={handleEdit}
          onClose={() => { setEditSource(null); clearMessages(); }}
        />
      )}

      {/* Toolbar */}
      {!showAdd && !editSource && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input className="swa-search" placeholder="Search sources…" type="search" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="swa-form-select" style={{ width: "auto", minWidth: 140 }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="swa-form-select" style={{ width: "auto", minWidth: 130 }} value={filterApproved} onChange={e => setFilterApproved(e.target.value)}>
              <option value="all">All status</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <button onClick={() => { setShowAdd(true); clearMessages(); }} className="swa-btn swa-btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Source
          </button>
        </div>
      )}

      {/* Sources list */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--admin-text-secondary)" }}>
            {sources.length === 0 ? "No sources in the vault yet" : "No sources match your filters"}
          </p>
          <p className="text-xs" style={{ color: "var(--admin-text-faint)" }}>
            {sources.length === 0
              ? "Add your first approved source above. AI content generation will only use URLs from this vault."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(source => (
            <div key={source.id} className="rounded-xl p-4" style={{ background: "#fff", border: `1px solid ${source.is_approved ? "var(--admin-border)" : "var(--admin-danger-light)"}`, boxShadow: "var(--admin-shadow-card)" }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5" style={{ background: "rgba(89,37,244,0.1)", color: "#5925f4" }}>
                  {source.domain.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm truncate" style={{ color: "var(--admin-text-primary)" }}>{source.title || source.domain}</span>
                    <button onClick={() => handleToggleApproved(source)} className={`admin-badge cursor-pointer ${source.is_approved ? "admin-badge-green" : "admin-badge-red"}`}>
                      {source.is_approved ? "✓ Approved" : "✗ Suspended"}
                    </button>
                    <span className="admin-badge admin-badge-slate capitalize">{source.category}</span>
                  </div>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs block truncate mb-1" style={{ color: "var(--admin-accent)" }}>{source.url}</a>
                  {source.description && <p className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>{source.description}</p>}
                  <div className="text-xs mt-1.5" style={{ color: "var(--admin-text-faint)" }}>Added {fmtDate(source.created_at)}</div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => { setEditSource(source); clearMessages(); }} className="admin-icon-btn" aria-label={`Edit ${source.title || source.domain}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  {confirmDelete === source.id ? (
                    <DangerConfirm message="Remove this source?" onConfirm={() => handleDelete(source)} onCancel={() => setConfirmDelete(null)} busy={busy} confirmLabel="Yes, remove" busyLabel="Removing…" />
                  ) : (
                    <button onClick={() => { setConfirmDelete(source.id); clearMessages(); }} disabled={busy} className="admin-icon-btn" aria-label={`Remove ${source.title || source.domain} from vault`} style={{ color: "var(--admin-danger)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info callout */}
      <div className="mt-6 rounded-xl p-4" style={{ background: "var(--admin-accent-bg)", border: "1px solid rgba(89,37,244,0.12)" }}>
        <div className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--admin-accent)" }}>How the Vault works</div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
          When AI content generation is triggered, the system passes only the <strong style={{ color: "var(--admin-text-secondary)" }}>approved</strong> vault sources to OpenAI as its permitted knowledge base. OpenAI is instructed to base all factual claims exclusively on these URLs and cite them in its output — preventing hallucinated statistics or uncited claims. Suspending a source removes it from AI prompts without deleting it.
        </p>
      </div>
    </div>
  );
}
