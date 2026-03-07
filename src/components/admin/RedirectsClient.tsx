"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  is_active: boolean;
  note: string;
  created_at: string;
}

const INPUT = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all";
const IS = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const IS_ERR = { background: "#fff", border: "1px solid var(--admin-danger)", color: "var(--admin-text-primary)", boxShadow: "0 0 0 3px rgba(220,38,38,0.12)" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LS = { color: "var(--admin-text-subtle)" };

const EMPTY: Omit<Redirect, "id" | "created_at"> = {
  from_path: "",
  to_path: "",
  status_code: 301,
  is_active: true,
  note: "",
};

export default function RedirectsClient({ initial }: { initial: Redirect[] }) {
  const [redirects, setRedirects] = useState<Redirect[]>(initial);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() =>
    redirects.filter(r =>
      r.from_path.toLowerCase().includes(search.toLowerCase()) ||
      r.to_path.toLowerCase().includes(search.toLowerCase()) ||
      r.note.toLowerCase().includes(search.toLowerCase())
    ), [redirects, search]);

  function startEdit(r: Redirect) {
    setEditId(r.id);
    setForm({ from_path: r.from_path, to_path: r.to_path, status_code: r.status_code, is_active: r.is_active, note: r.note });
    setError(""); setSuccess(""); setFieldErrors({});
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ ...EMPTY });
    setError(""); setFieldErrors({});
  }

  function validateForm() {
    const errs: Record<string, string> = {};
    if (!form.from_path.trim()) errs.from_path = "From path is required.";
    else if (!form.from_path.startsWith("/")) errs.from_path = "Must start with /";
    if (!form.to_path.trim()) errs.to_path = "Destination path is required.";
    else if (!form.to_path.startsWith("/") && !form.to_path.startsWith("http")) errs.to_path = "Must start with / or https://";
    return errs;
  }

  function setField(key: keyof typeof EMPTY, value: string | number | boolean) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSaving(true);
    setError(""); setSuccess(""); setFieldErrors({});
    const sb = createClient();

    const payload = {
      from_path: form.from_path.trim(),
      to_path: form.to_path.trim(),
      status_code: Number(form.status_code),
      is_active: form.is_active,
      note: form.note.trim(),
    };

    if (editId) {
      const { error: err } = await sb.from("redirects").update(payload).eq("id", editId);
      if (err) {
        setError(err.message);
      } else {
        setRedirects(rs => rs.map(r => r.id === editId ? { ...r, ...payload } : r));
        setSuccess("Redirect updated.");
        cancelEdit();
      }
    } else {
      const { data, error: err } = await sb.from("redirects").insert(payload).select().single();
      if (err) {
        setError(err.message.includes("unique") ? `A redirect from "${payload.from_path}" already exists.` : err.message);
      } else {
        setRedirects(rs => [data, ...rs]);
        setForm({ ...EMPTY });
        setSuccess("Redirect added.");
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const sb = createClient();
    const { error: err } = await sb.from("redirects").delete().eq("id", id);
    if (err) { setError(err.message); setConfirmDelete(null); return; }
    setRedirects(rs => rs.filter(r => r.id !== id));
    setSuccess("Redirect deleted.");
    setConfirmDelete(null);
    if (editId === id) cancelEdit();
  }

  async function toggleActive(r: Redirect) {
    const sb = createClient();
    const { error: err } = await sb.from("redirects").update({ is_active: !r.is_active }).eq("id", r.id);
    if (err) { setError(err.message); return; }
    setRedirects(rs => rs.map(x => x.id === r.id ? { ...x, is_active: !r.is_active } : x));
  }

  return (
    <div className="flex gap-6">
      {/* Left: list */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <div className="mb-4 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <label htmlFor="redirect-search" className="sr-only">Search redirects</label>
          <input id="redirect-search" className={INPUT} style={{ ...IS, paddingLeft: "2.25rem" }}
            placeholder="Search redirects…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Feedback */}
        {error   && <div className="admin-alert admin-alert-error mb-3" role="alert">{error}</div>}
        {success && <div className="admin-alert admin-alert-success mb-3" role="status">{success}</div>}

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">From</th>
                <th scope="col">To</th>
                <th scope="col">Code</th>
                <th scope="col">Status</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "var(--admin-text-faint)" }}>
                    {search ? "No redirects match your search." : "No redirects yet. Add one using the form →"}
                  </td>
                </tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} style={editId === r.id ? { background: "rgba(89,37,244,0.04)" } : undefined}>
                  <td style={{ maxWidth: "200px" }}>
                    <div className="font-mono text-xs font-semibold truncate" style={{ color: "var(--admin-accent)" }}>{r.from_path}</div>
                    {r.note && <div className="text-xs mt-0.5 truncate" style={{ color: "var(--admin-text-faint)" }}>{r.note}</div>}
                  </td>
                  <td style={{ maxWidth: "200px" }}>
                    <div className="font-mono text-xs truncate" style={{ color: "var(--admin-text-muted)" }}>{r.to_path}</div>
                  </td>
                  <td>
                    <span className="admin-badge font-mono" style={r.status_code === 301
                      ? { background: "rgba(89,37,244,0.1)", color: "#5925f4" }
                      : { background: "#fef9c3", color: "#854d0e" }}>
                      {r.status_code}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toggleActive(r)}
                      className={`admin-badge cursor-pointer ${r.is_active ? "admin-badge-green" : "admin-badge-slate"}`}>
                      {r.is_active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td>
                    {confirmDelete === r.id ? (
                      <div className="admin-danger-confirm">
                        <span>Delete <strong>{r.from_path}</strong>?</span>
                        <button onClick={() => handleDelete(r.id)}
                          className="admin-btn admin-btn-danger" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                          Yes, delete
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="admin-btn admin-btn-secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(r)} className="admin-icon-btn" aria-label={`Edit redirect from ${r.from_path}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setConfirmDelete(r.id)} className="admin-icon-btn" aria-label={`Delete redirect from ${r.from_path}`}
                          style={{ color: "var(--admin-danger)" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs" style={{ color: "var(--admin-text-faint)" }}>
          {redirects.length} redirect{redirects.length !== 1 ? "s" : ""} total · {redirects.filter(r => r.is_active).length} active
        </div>
      </div>

      {/* Right: add / edit form */}
      <div className="w-80 flex-shrink-0">
        <div className="admin-form-panel sticky top-6">
          <h2>{editId ? "Edit Redirect" : "Add Redirect"}</h2>

          <div className="space-y-5">
            <div>
              <label htmlFor="rdr-from" className={LABEL} style={LS}>From Path</label>
              <input id="rdr-from" className={INPUT} style={fieldErrors.from_path ? IS_ERR : IS}
                value={form.from_path} onChange={e => { setField("from_path", e.target.value); setFieldErrors(f => ({ ...f, from_path: "" })); }}
                placeholder="/old-page-slug" />
              {fieldErrors.from_path
                ? <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.from_path}</p>
                : <div className="text-xs mt-1.5" style={{ color: "var(--admin-text-faint)" }}>Must start with /</div>}
            </div>

            <div>
              <label htmlFor="rdr-to" className={LABEL} style={LS}>To Path / URL</label>
              <input id="rdr-to" className={INPUT} style={fieldErrors.to_path ? IS_ERR : IS}
                value={form.to_path} onChange={e => { setField("to_path", e.target.value); setFieldErrors(f => ({ ...f, to_path: "" })); }}
                placeholder="/new-page-slug" />
              {fieldErrors.to_path
                ? <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.to_path}</p>
                : <div className="text-xs mt-1.5" style={{ color: "var(--admin-text-faint)" }}>Start with / or https://</div>}
            </div>

            <div>
              <label htmlFor="rdr-code" className={LABEL} style={LS}>Status Code</label>
              <select id="rdr-code" className={INPUT} style={IS} value={form.status_code} onChange={e => setField("status_code", Number(e.target.value))}>
                <option value={301}>301 — Permanent</option>
                <option value={302}>302 — Temporary</option>
              </select>
            </div>

            <div>
              <label htmlFor="rdr-note" className={LABEL} style={LS}>Note (optional)</label>
              <input id="rdr-note" className={INPUT} style={IS} value={form.note} onChange={e => setField("note", e.target.value)} placeholder="Why this redirect exists" />
            </div>

            <label htmlFor="rdr-active" className="flex items-center gap-2.5 cursor-pointer">
              <input id="rdr-active" type="checkbox" checked={form.is_active} onChange={e => setField("is_active", e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: "#5925f4" }} />
              <span className="text-sm font-medium" style={{ color: "var(--admin-text-secondary)" }}>Active</span>
            </label>
          </div>

          <div className="flex flex-col gap-2 mt-8 pt-6" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary w-full"
              style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : editId ? "Update Redirect" : "Add Redirect"}
            </button>
            {editId && (
              <button onClick={cancelEdit} className="admin-btn admin-btn-secondary w-full">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
