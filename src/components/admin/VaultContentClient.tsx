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
  type AdminVaultContent,
  type FieldErrors,
} from "@/components/admin/ui";

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------

const CATEGORIES = ["general", "mental health", "education", "government", "research", "statistics", "other"];

function validateForm(title: string, content: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!title.trim()) errs.title = "Title is required.";
  if (!content.trim()) errs.content = "Content is required.";
  return errs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VaultContentClient({ initialContent }: { initialContent: AdminVaultContent[] }) {
  const [items, setItems]   = useState<AdminVaultContent[]>(initialContent);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Add form
  const [showAdd, setShowAdd]       = useState(false);
  const [addTitle, setAddTitle]     = useState("");
  const [addContent, setAddContent] = useState("");
  const [addSource, setAddSource]   = useState("");
  const [addCat, setAddCat]         = useState("general");

  // Edit form
  const [editItem, setEditItem]             = useState<AdminVaultContent | null>(null);
  const [editTitle, setEditTitle]           = useState("");
  const [editContent, setEditContent]       = useState("");
  const [editSource, setEditSource]         = useState("");
  const [editCategory, setEditCategory]     = useState("general");

  // Expand/collapse content preview
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Shared
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Derived
  const filtered = useMemo(() => {
    return items.filter(i => {
      const q = search.toLowerCase();
      const matchSearch = !search || i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q) || i.source.toLowerCase().includes(q);
      const matchCat = filterCategory === "all" || i.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [items, search, filterCategory]);

  // Helpers
  function clearMessages() { setError(""); setSuccess(""); }

  function closeAddPanel() {
    setShowAdd(false);
    setAddTitle(""); setAddContent(""); setAddSource(""); setAddCat("general");
    setFieldErrors({}); clearMessages();
  }

  function closeEditPanel() {
    setEditItem(null);
    setEditTitle(""); setEditContent(""); setEditSource(""); setEditCategory("general");
    clearMessages();
  }

  function openEditPanel(item: AdminVaultContent) {
    setEditItem(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditSource(item.source);
    setEditCategory(item.category);
    clearMessages(); setFieldErrors({});
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Mutations
  async function handleAdd() {
    const errs = validateForm(addTitle, addContent);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { data, error: err } = await sb
        .from("vault_content")
        .insert({
          title: addTitle.trim(),
          content: addContent.trim(),
          source: addSource.trim(),
          category: addCat,
          is_approved: true,
        })
        .select()
        .single();
      if (err) { setError(err.message); return; }
      setItems(prev => [data, ...prev]);
      setSuccess(`Content block "${data.title}" added.`);
      closeAddPanel();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit() {
    if (!editItem) return;
    const errs = validateForm(editTitle, editContent);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { error: err } = await sb
        .from("vault_content")
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          source: editSource.trim(),
          category: editCategory,
        })
        .eq("id", editItem.id);
      if (err) { setError(err.message); return; }
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, title: editTitle.trim(), content: editContent.trim(), source: editSource.trim(), category: editCategory } : i));
      setSuccess(`Content block "${editTitle.trim()}" updated.`);
      closeEditPanel();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item: AdminVaultContent) {
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { error: err } = await sb.from("vault_content").delete().eq("id", item.id);
      if (err) { setError(err.message); return; }
      setItems(prev => prev.filter(i => i.id !== item.id));
      setSuccess(`"${item.title}" deleted.`);
      setConfirmDelete(null);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Render
  return (
    <div>
      {/* Feedback */}
      {error   && <div className="admin-alert admin-alert-error"  role="alert">{error}</div>}
      {success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* Add Content Block Panel */}
      {showAdd && (
        <div className="swa-card" role="region" aria-label="Add content block" style={{ marginBottom: 24 }}>
          <FormPanelHeader
            title={<><div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-primary)" }}>The Vault</div>Add Content Block</>}
            subtitle="Paste verified content below. This will be available as a trusted reference for AI generation."
            onClose={closeAddPanel}
            closeLabel="Close add content form"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AdminField id="vc-title" label="Title" error={fieldErrors.title} className="md:col-span-2">
              <input
                id="vc-title"
                className={INPUT_CLS}
                style={inputStyle(!!fieldErrors.title)}
                value={addTitle}
                onChange={e => { setAddTitle(e.target.value); setFieldErrors(f => ({ ...f, title: "" })); }}
                placeholder="e.g. Youth Mental Health Statistics 2024"
                autoFocus
              />
            </AdminField>

            <AdminField id="vc-content" label="Content" error={fieldErrors.content} className="md:col-span-2">
              <textarea
                id="vc-content"
                rows={8}
                className={INPUT_CLS}
                style={{
                  ...inputStyle(!!fieldErrors.content),
                  resize: "vertical",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                }}
                value={addContent}
                onChange={e => { setAddContent(e.target.value); setFieldErrors(f => ({ ...f, content: "" })); }}
                placeholder="Paste the verified content here…"
              />
            </AdminField>

            <AdminField
              id="vc-source"
              label={<>Source / Attribution <span style={{ color: "var(--color-text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></>}
            >
              <input
                id="vc-source"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                value={addSource}
                onChange={e => setAddSource(e.target.value)}
                placeholder="e.g. AIHW Report 2024, Page 42"
              />
            </AdminField>

            <AdminField id="vc-category" label="Category">
              <select id="vc-category" className={INPUT_CLS} style={INPUT_STYLE} value={addCat} onChange={e => setAddCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </AdminField>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAdd} disabled={busy} className="swa-btn swa-btn--primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Add Content"}
            </button>
            <button
              onClick={closeAddPanel}
              style={{ padding: "9px 16px", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-card)", color: "var(--color-text-muted)", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Content Block Panel */}
      {editItem && (
        <div className="swa-card" role="region" aria-label="Edit content block" style={{ marginBottom: 24 }}>
          <FormPanelHeader title="Edit Content Block" onClose={closeEditPanel} closeLabel="Close edit form" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AdminField id="vc-edit-title" label="Title" error={fieldErrors.title} className="md:col-span-2">
              <input id="vc-edit-title" className={INPUT_CLS} style={inputStyle(!!fieldErrors.title)} value={editTitle} onChange={e => { setEditTitle(e.target.value); setFieldErrors(f => ({ ...f, title: "" })); }} />
            </AdminField>
            <AdminField id="vc-edit-content" label="Content" error={fieldErrors.content} className="md:col-span-2">
              <textarea id="vc-edit-content" rows={8} className={INPUT_CLS} style={{ ...inputStyle(!!fieldErrors.content), resize: "vertical", lineHeight: 1.7 }} value={editContent} onChange={e => { setEditContent(e.target.value); setFieldErrors(f => ({ ...f, content: "" })); }} />
            </AdminField>
            <AdminField id="vc-edit-source" label="Source / Attribution">
              <input id="vc-edit-source" className={INPUT_CLS} style={INPUT_STYLE} value={editSource} onChange={e => setEditSource(e.target.value)} />
            </AdminField>
            <AdminField id="vc-edit-category" label="Category">
              <select id="vc-edit-category" className={INPUT_CLS} style={INPUT_STYLE} value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </AdminField>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleEdit} disabled={busy} className="swa-btn swa-btn--primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={closeEditPanel} style={{ padding: "9px 16px", fontSize: 13, fontWeight: 600, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-card)", color: "var(--color-text-muted)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!showAdd && !editItem && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input className="swa-search" placeholder="Search content…" type="search" value={search} onChange={e => setSearch(e.target.value)} />
            <select
              className="swa-search"
              style={{ width: 160 }}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ fontSize: 13, color: "var(--color-text-faint)" }}>
              {filtered.length} of {items.length} blocks
            </span>
          </div>
          <button
            onClick={() => { setShowAdd(true); clearMessages(); setFieldErrors({}); }}
            className="swa-btn swa-btn--primary"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Content Block
          </button>
        </div>
      )}

      {/* Content list */}
      {filtered.length === 0 ? (
        <div className="swa-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--color-text-faint)", marginBottom: 12, display: "block" }}>description</span>
          <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
            {items.length === 0 ? "No content blocks yet" : "No blocks match your search"}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
            {items.length === 0
              ? "Add verified content that the AI can reference when generating pages."
              : `No results for "${search}"`}
          </div>
          {items.length === 0 && (
            <button onClick={() => { setShowAdd(true); clearMessages(); }} className="swa-btn swa-btn--primary">
              Add your first content block
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(item => {
            const isExpanded = expanded.has(item.id);
            const preview = item.content.length > 200 && !isExpanded
              ? item.content.slice(0, 200) + "…"
              : item.content;

            return (
              <div key={item.id} className="swa-card" style={{ padding: 0 }}>
                <div style={{ padding: "16px 20px" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text-primary)", marginBottom: 4 }}>{item.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="swa-badge swa-badge--primary" style={{ textTransform: "capitalize" }}>{item.category}</span>
                        {item.source && (
                          <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>
                            Source: {item.source}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>{fmtDate(item.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => openEditPanel(item)}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-primary)", border: "1px solid transparent", cursor: "pointer" }}
                        aria-label={`Edit ${item.title}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {confirmDelete === item.id ? (
                        <DangerConfirm
                          message={<>Delete <strong>{item.title}</strong>?</>}
                          onConfirm={() => handleDelete(item)}
                          onCancel={() => setConfirmDelete(null)}
                          busy={busy}
                        />
                      ) : (
                        <button
                          onClick={() => { setConfirmDelete(item.id); clearMessages(); }}
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-error)", border: "1px solid transparent", cursor: "pointer" }}
                          aria-label={`Delete ${item.title}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content body */}
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-body)",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-primary-pale)",
                      border: "1px solid var(--color-primary-light)",
                    }}
                  >
                    {preview}
                  </div>
                  {item.content.length > 200 && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="swa-btn-ghost"
                      style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)", marginTop: 6, padding: "2px 0", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {isExpanded ? "Show less ↑" : "Show more ↓"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
