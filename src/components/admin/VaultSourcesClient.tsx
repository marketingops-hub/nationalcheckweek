"use client";

import React, { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface VaultSource {
  id: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  is_approved: boolean;
  created_at: string;
}

const CATEGORIES = ["general", "mental health", "education", "government", "research", "statistics", "other"];

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none";
const INPUT_STYLE: React.CSSProperties = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LABEL_STYLE: React.CSSProperties = { color: "var(--admin-text-subtle)" };

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function getDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function VaultSourcesClient({ initialSources }: { initialSources: VaultSource[] }) {
  const [sources, setSources] = useState<VaultSource[]>(initialSources);
  const [showAdd, setShowAdd] = useState(false);
  const [editSource, setEditSource] = useState<VaultSource | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [pasteText, setPasteText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterApproved, setFilterApproved] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearMessages() { setError(""); setSuccess(""); setFieldErrors({}); }

  function validateAdd() {
    const errs: Record<string, string> = {};
    const url = pasteText.trim();
    if (!url) { errs.pasteText = "URL is required."; return errs; }
    try { new URL(url); } catch { errs.pasteText = "Enter a valid URL starting with http:// or https://"; }
    return errs;
  }

  const filtered = useMemo(() => {
    return sources.filter(s => {
      const matchSearch = !search || s.url.includes(search) || s.title.toLowerCase().includes(search.toLowerCase()) || s.domain.includes(search);
      const matchCat = filterCategory === "all" || s.category === filterCategory;
      const matchApproved = filterApproved === "all" || (filterApproved === "approved" ? s.is_approved : !s.is_approved);
      return matchSearch && matchCat && matchApproved;
    });
  }, [sources, search, filterCategory, filterApproved]);

  const approvedCount = sources.filter(s => s.is_approved).length;

  async function handleAdd() {
    const errs = validateAdd();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    const url = pasteText.trim();
    setBusy(true); clearMessages();
    const sb = createClient();
    const { data, error: err } = await sb
      .from("vault_sources")
      .insert({
        url,
        title: title.trim() || getDomainFromUrl(url),
        description: description.trim(),
        category,
        is_approved: true,
      })
      .select()
      .single();

    if (err) {
      if (err.code === "23505") setError("This URL is already in the vault.");
      else setError(err.message);
      setBusy(false);
      return;
    }

    setSources(s => [data, ...s]);
    setPasteText(""); setTitle(""); setDescription(""); setCategory("general");
    setShowAdd(false);
    setSuccess(`✓ Source added: ${data.domain}`);
    setBusy(false);
  }

  async function handleEdit() {
    if (!editSource) return;
    setBusy(true); clearMessages();
    const sb = createClient();
    const { error: err } = await sb
      .from("vault_sources")
      .update({ title: editTitle.trim(), description: editDescription.trim(), category: editCategory })
      .eq("id", editSource.id);
    if (err) { setError(err.message); setBusy(false); return; }
    setSources(s => s.map(s2 => s2.id === editSource.id
      ? { ...s2, title: editTitle.trim(), description: editDescription.trim(), category: editCategory }
      : s2
    ));
    setEditSource(null);
    setSuccess("✓ Source updated.");
    setBusy(false);
  }

  async function handleToggleApproved(source: VaultSource) {
    const sb = createClient();
    const { error: err } = await sb
      .from("vault_sources")
      .update({ is_approved: !source.is_approved })
      .eq("id", source.id);
    if (err) { setError(err.message); return; }
    setSources(s => s.map(s2 => s2.id === source.id ? { ...s2, is_approved: !s2.is_approved } : s2));
  }

  async function handleDelete(source: VaultSource) {
    setBusy(true); clearMessages();
    const sb = createClient();
    const { error: err } = await sb.from("vault_sources").delete().eq("id", source.id);
    if (err) { setError(err.message); setBusy(false); setConfirmDelete(null); return; }
    setSources(s => s.filter(s2 => s2.id !== source.id));
    setSuccess("Source removed from vault.");
    setConfirmDelete(null);
    setBusy(false);
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
      {!showAdd && !editSource && error   && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {!showAdd && !editSource && success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* Add Source inline panel */}
      {showAdd && (
        <div className="admin-form-panel" role="region" aria-label="Add vault source">
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--admin-accent)" }}>The Vault</div>
              <h2 style={{ margin: 0, border: "none", padding: 0 }}>Add Approved Source</h2>
              <p className="text-sm mt-1" style={{ color: "var(--admin-text-subtle)" }}>Paste a URL below. OpenAI will only use approved vault sources when generating content.</p>
            </div>
            <button onClick={() => { setShowAdd(false); clearMessages(); }} className="admin-icon-btn" aria-label="Close add source form">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label htmlFor="vault-url" className={LABEL} style={LABEL_STYLE}>URL — paste here</label>
              <textarea id="vault-url" rows={2} className={INPUT}
                style={fieldErrors.pasteText ? { ...INPUT_STYLE, resize: "none", fontFamily: "monospace", fontSize: "0.8rem", border: "1px solid var(--admin-danger)", boxShadow: "0 0 0 3px rgba(220,38,38,0.12)" } : { ...INPUT_STYLE, resize: "none", fontFamily: "monospace", fontSize: "0.8rem" }}
                value={pasteText} onChange={e => { setPasteText(e.target.value.trim()); setFieldErrors(f => ({ ...f, pasteText: "" })); }}
                placeholder="https://www.aihw.gov.au/reports/mental-health/..." autoFocus />
              {fieldErrors.pasteText && <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.pasteText}</p>}
            </div>
            <div>
              <label htmlFor="vault-title" className={LABEL} style={LABEL_STYLE}>Title <span style={{ color: "var(--admin-text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input id="vault-title" className={INPUT} style={INPUT_STYLE} value={title}
                onChange={e => setTitle(e.target.value)} placeholder="e.g. AIHW Mental Health Report 2023" />
            </div>
            <div>
              <label htmlFor="vault-category" className={LABEL} style={LABEL_STYLE}>Category</label>
              <select id="vault-category" className={INPUT} style={INPUT_STYLE} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="vault-desc" className={LABEL} style={LABEL_STYLE}>Description <span style={{ color: "var(--admin-text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <textarea id="vault-desc" rows={2} className={INPUT} style={{ ...INPUT_STYLE, resize: "none" }}
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief note about what this source covers…" />
            </div>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Adding…" : "Add to Vault"}
            </button>
            <button onClick={() => { setShowAdd(false); clearMessages(); }} className="admin-btn admin-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Edit Source inline panel */}
      {editSource && (
        <div className="admin-form-panel" role="region" aria-label="Edit vault source">
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div>
              <h2 style={{ margin: 0, border: "none", padding: 0 }}>Edit Source</h2>
              <p className="text-xs mt-1 font-mono truncate" style={{ color: "var(--admin-text-faint)", maxWidth: 400 }}>{editSource.url}</p>
              <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>URL cannot be changed. Delete and re-add to change the URL.</p>
            </div>
            <button onClick={() => { setEditSource(null); clearMessages(); }} className="admin-icon-btn" aria-label="Close edit source form">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="edit-vault-title" className={LABEL} style={LABEL_STYLE}>Title</label>
              <input id="edit-vault-title" className={INPUT} style={INPUT_STYLE} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="edit-vault-category" className={LABEL} style={LABEL_STYLE}>Category</label>
              <select id="edit-vault-category" className={INPUT} style={INPUT_STYLE} value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="edit-vault-desc" className={LABEL} style={LABEL_STYLE}>Description</label>
              <textarea id="edit-vault-desc" rows={2} className={INPUT} style={{ ...INPUT_STYLE, resize: "none" }}
                value={editDescription} onChange={e => setEditDescription(e.target.value)} />
            </div>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleEdit} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={() => { setEditSource(null); clearMessages(); }} className="admin-btn admin-btn-secondary">Cancel</button>
          </div>
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
            <div
              key={source.id}
              className="rounded-xl p-4"
              style={{
                background: "#fff",
                border: `1px solid ${source.is_approved ? "var(--admin-border)" : "var(--admin-danger-light)"}`,
                boxShadow: "var(--admin-shadow-card)",
              }}
            >
              <div className="flex items-start gap-3">
                {/* Domain favicon placeholder */}
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: "rgba(89,37,244,0.1)", color: "#5925f4" }}
                >
                  {source.domain.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm truncate" style={{ color: "var(--admin-text-primary)" }}>
                      {source.title || source.domain}
                    </span>
                    {/* Approved badge */}
                    <button
                      onClick={() => handleToggleApproved(source)}
                      className={`admin-badge cursor-pointer ${source.is_approved ? "admin-badge-green" : "admin-badge-red"}`}
                    >
                      {source.is_approved ? "✓ Approved" : "✗ Suspended"}
                    </button>
                    {/* Category */}
                    <span className="admin-badge admin-badge-slate capitalize">
                      {source.category}
                    </span>
                  </div>

                  {/* URL */}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs block truncate mb-1"
                    style={{ color: "var(--admin-accent)" }}
                  >
                    {source.url}
                  </a>

                  {/* Description */}
                  {source.description && (
                    <p className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>{source.description}</p>
                  )}

                  <div className="text-xs mt-1.5" style={{ color: "var(--admin-text-faint)" }}>Added {fmt(source.created_at)}</div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditSource(source); setEditTitle(source.title); setEditDescription(source.description); setEditCategory(source.category); clearMessages(); }}
                    className="admin-icon-btn" aria-label={`Edit ${source.title || source.domain}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  {confirmDelete === source.id ? (
                    <div className="admin-danger-confirm" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ fontSize: "0.75rem" }}>Remove this source?</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(source)} disabled={busy}
                          className="admin-btn admin-btn-danger" style={{ padding: "3px 8px", fontSize: "0.6875rem", opacity: busy ? 0.6 : 1 }}>
                          {busy ? "Removing…" : "Yes, remove"}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="admin-btn admin-btn-secondary" style={{ padding: "3px 8px", fontSize: "0.6875rem" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDelete(source.id); clearMessages(); }}
                      disabled={busy}
                      className="admin-icon-btn" aria-label={`Remove ${source.title || source.domain} from vault`}
                      style={{ color: "var(--admin-danger)" }}
                    >
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
