"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AdminField,
  DangerConfirm,
  FormPanelHeader,
  INPUT_CLS,
  INPUT_STYLE,
  inputStyle,
  fmtDate,
  getDomainFromUrl,
  type AdminVaultSource,
  type FieldErrors,
} from "@/components/admin/ui";

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------

const CATEGORIES = ["general", "mental health", "education", "government", "research", "statistics", "other"];

/** Validates the add-source form. Returns a FieldErrors map (empty = valid). */
function validateAddForm(url: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!url) { errs.url = "URL is required."; return errs; }
  try { new URL(url); } catch { errs.url = "Enter a valid URL starting with http:// or https://"; }
  return errs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VaultSourcesClient({ initialSources }: { initialSources: AdminVaultSource[] }) {
  // ── List state ──
  const [sources, setSources]           = useState<AdminVaultSource[]>(initialSources);
  const [search, setSearch]             = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterApproved, setFilterApproved] = useState("all");

  // ── Add-form state ──
  const [showAdd, setShowAdd]   = useState(false);
  const [addUrl, setAddUrl]     = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addDesc, setAddDesc]   = useState("");
  const [addCat, setAddCat]     = useState("general");

  // ── Edit-form state ──
  const [editSource, setEditSource]           = useState<AdminVaultSource | null>(null);
  const [editTitle, setEditTitle]             = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory]       = useState("general");

  // ── Shared async state ──
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Helpers ──

  function clearMessages() { setError(""); setSuccess(""); }

  function closeAddPanel() {
    setShowAdd(false);
    setAddUrl(""); setAddTitle(""); setAddDesc(""); setAddCat("general");
    setFieldErrors({}); clearMessages();
  }

  function closeEditPanel() {
    setEditSource(null);
    setEditTitle(""); setEditDescription(""); setEditCategory("general");
    clearMessages();
  }

  function openEditPanel(source: AdminVaultSource) {
    setEditSource(source);
    setEditTitle(source.title);
    setEditDescription(source.description);
    setEditCategory(source.category);
    clearMessages(); setFieldErrors({});
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

  // ── Mutation handlers ──

  async function handleAdd() {
    const url = addUrl.trim();
    const errs = validateAddForm(url);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { data, error: err } = await sb
        .from("vault_sources")
        .insert({
          url,
          title: addTitle.trim() || getDomainFromUrl(url),
          description: addDesc.trim(),
          category: addCat,
          is_approved: true,
        })
        .select()
        .single();
      if (err) {
        setError(err.code === "23505" ? "This URL is already in the vault." : err.message);
        return;
      }
      setSources(s => [data, ...s]);
      setSuccess(`Source added: ${data.domain}`);
      closeAddPanel();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit() {
    if (!editSource) return;
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { error: err } = await sb
        .from("vault_sources")
        .update({ title: editTitle.trim(), description: editDescription.trim(), category: editCategory })
        .eq("id", editSource.id);
      if (err) { setError(err.message); return; }
      setSources(s => s.map(s2 => s2.id === editSource.id
        ? { ...s2, title: editTitle.trim(), description: editDescription.trim(), category: editCategory }
        : s2
      ));
      setSuccess("Source updated.");
      closeEditPanel();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleApproved(source: AdminVaultSource) {
    const sb = createClient();
    const { error: err } = await sb
      .from("vault_sources")
      .update({ is_approved: !source.is_approved })
      .eq("id", source.id);
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
      {!showAdd && !editSource && error   && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {!showAdd && !editSource && success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* ── Add Source inline panel ── */}
      {showAdd && (
        <div className="admin-form-panel" role="region" aria-label="Add vault source">
          <FormPanelHeader
            title={
              <>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--admin-accent)" }}>The Vault</div>
                Add Approved Source
              </>
            }
            subtitle="Paste a URL below. OpenAI will only use approved vault sources when generating content."
            onClose={closeAddPanel}
            closeLabel="Close add source form"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AdminField id="vault-url" label="URL — paste here" error={fieldErrors.url} className="md:col-span-2">
              <textarea
                id="vault-url"
                rows={2}
                className={INPUT_CLS}
                style={{
                  ...inputStyle(!!fieldErrors.url),
                  resize: "none",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
                value={addUrl}
                onChange={e => { setAddUrl(e.target.value); setFieldErrors(f => ({ ...f, url: "" })); }}
                placeholder="https://www.aihw.gov.au/reports/mental-health/..."
                autoFocus
              />
            </AdminField>
            <AdminField
              id="vault-title"
              label={<>Title <span style={{ color: "var(--admin-text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></>}
            >
              <input
                id="vault-title"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                value={addTitle}
                onChange={e => setAddTitle(e.target.value)}
                placeholder="e.g. AIHW Mental Health Report 2023"
              />
            </AdminField>
            <AdminField id="vault-category" label="Category">
              <select
                id="vault-category"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                value={addCat}
                onChange={e => setAddCat(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </AdminField>
            <AdminField
              id="vault-desc"
              label={<>Description <span style={{ color: "var(--admin-text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></>}
              className="md:col-span-2"
            >
              <textarea
                id="vault-desc"
                rows={2}
                className={INPUT_CLS}
                style={{ ...INPUT_STYLE, resize: "none" }}
                value={addDesc}
                onChange={e => setAddDesc(e.target.value)}
                placeholder="Brief note about what this source covers…"
              />
            </AdminField>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Adding…" : "Add to Vault"}
            </button>
            <button onClick={closeAddPanel} className="admin-btn admin-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Edit Source inline panel ── */}
      {editSource && (
        <div className="admin-form-panel" role="region" aria-label="Edit vault source">
          <FormPanelHeader
            title="Edit Source"
            subtitle={
              <>
                <span className="font-mono truncate block" style={{ color: "var(--admin-text-faint)", maxWidth: 400 }}>{editSource.url}</span>
                URL cannot be changed. Delete and re-add to change the URL.
              </>
            }
            onClose={closeEditPanel}
            closeLabel="Close edit source form"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <AdminField id="edit-vault-title" label="Title">
              <input
                id="edit-vault-title"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />
            </AdminField>
            <AdminField id="edit-vault-category" label="Category">
              <select
                id="edit-vault-category"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </AdminField>
            <AdminField id="edit-vault-desc" label="Description" className="md:col-span-3">
              <textarea
                id="edit-vault-desc"
                rows={2}
                className={INPUT_CLS}
                style={{ ...INPUT_STYLE, resize: "none" }}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
              />
            </AdminField>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleEdit} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={closeEditPanel} className="admin-btn admin-btn-secondary">Cancel</button>
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

                  <div className="text-xs mt-1.5" style={{ color: "var(--admin-text-faint)" }}>Added {fmtDate(source.created_at)}</div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openEditPanel(source)}
                    className="admin-icon-btn" aria-label={`Edit ${source.title || source.domain}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  {confirmDelete === source.id ? (
                    <DangerConfirm
                      message="Remove this source?"
                      onConfirm={() => handleDelete(source)}
                      onCancel={() => setConfirmDelete(null)}
                      busy={busy}
                      confirmLabel="Yes, remove"
                      busyLabel="Removing…"
                    />
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
