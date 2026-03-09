"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AdminField,
  INPUT_CLS,
  INPUT_STYLE,
  type FieldErrors,
} from "@/components/admin/ui";

export interface PromptTemplate {
  id: string;
  page_type: "state" | "area";
  section_key: string;
  label: string;
  prompt: string;
  model: string;
  updated_at: string;
}

const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];

const VARIABLE_HINT: Record<string, string> = {
  state: "Available variable: {{state_name}}",
  area:  "Available variables: {{city_name}}, {{state_name}}",
};

export default function PromptsClient({ initialPrompts }: { initialPrompts: PromptTemplate[] }) {
  const [prompts, setPrompts]       = useState<PromptTemplate[]>(initialPrompts);
  const [activeTab, setActiveTab]   = useState<"state" | "area">("state");
  const [editId, setEditId]         = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editModel, setEditModel]   = useState("gpt-4o");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const filtered = prompts.filter(p => p.page_type === activeTab);

  function openEdit(p: PromptTemplate) {
    setEditId(p.id);
    setEditPrompt(p.prompt);
    setEditModel(p.model);
    setError(""); setSuccess(""); setFieldErrors({});
  }

  function closeEdit() {
    setEditId(null);
    setEditPrompt(""); setEditModel("gpt-4o");
    setError(""); setFieldErrors({});
  }

  async function handleSave() {
    if (!editId) return;
    if (!editPrompt.trim()) {
      setFieldErrors({ prompt: "Prompt cannot be empty." });
      return;
    }
    setSaving(true); setError(""); setSuccess("");
    const sb = createClient();
    try {
      const { error: err } = await sb
        .from("prompt_templates")
        .update({ prompt: editPrompt.trim(), model: editModel })
        .eq("id", editId);
      if (err) { setError(err.message); return; }
      setPrompts(ps => ps.map(p => p.id === editId
        ? { ...p, prompt: editPrompt.trim(), model: editModel, updated_at: new Date().toISOString() }
        : p
      ));
      setSuccess("Prompt saved.");
      closeEdit();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  const editing = prompts.find(p => p.id === editId);

  return (
    <div className="space-y-6">

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)", width: "fit-content" }}>
        {(["state", "area"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); closeEdit(); }}
            className="px-5 py-2 rounded-lg text-sm font-semibold capitalize"
            style={activeTab === tab
              ? { background: "#fff", color: "var(--admin-text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.10)" }
              : { background: "transparent", color: "var(--admin-text-subtle)" }}
          >
            {tab === "state" ? "State Pages" : "City / Area Pages"}
          </button>
        ))}
      </div>

      {/* Variable hint */}
      <div className="text-xs px-4 py-2.5 rounded-lg" style={{ background: "var(--admin-accent-bg)", color: "var(--admin-accent)", border: "1px solid rgba(89,37,244,0.15)" }}>
        <strong>Variables:</strong> {VARIABLE_HINT[activeTab]} — these are interpolated at generation time.
      </div>

      {/* Feedback */}
      {error   && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* Inline edit panel */}
      {editId && editing && (
        <div className="admin-form-panel" role="region" aria-label="Edit prompt">
          <div className="flex items-start justify-between mb-5 pb-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--admin-accent)" }}>
                {editing.page_type === "state" ? "State Page" : "City / Area Page"}
              </div>
              <h2 className="text-base font-bold" style={{ color: "var(--admin-text-primary)" }}>{editing.label}</h2>
              <div className="text-xs mt-1" style={{ color: "var(--admin-text-faint)" }}>
                Section key: <code className="font-mono">{editing.section_key}</code>
              </div>
            </div>
            <button onClick={closeEdit} className="admin-icon-btn" aria-label="Close editor">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <AdminField id="edit-prompt" label="Prompt Template" error={fieldErrors.prompt} className="md:col-span-3">
              <textarea
                id="edit-prompt"
                rows={14}
                className={INPUT_CLS}
                style={{ ...INPUT_STYLE, resize: "vertical", fontFamily: "monospace", fontSize: "0.8125rem", lineHeight: 1.6 }}
                value={editPrompt}
                onChange={e => { setEditPrompt(e.target.value); setFieldErrors({}); }}
              />
            </AdminField>
            <div className="space-y-5">
              <AdminField id="edit-model" label="Model">
                <select
                  id="edit-model"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                  value={editModel}
                  onChange={e => setEditModel(e.target.value)}
                >
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </AdminField>
              <div className="rounded-lg p-3 text-xs space-y-1.5" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)", color: "var(--admin-text-subtle)" }}>
                <div className="font-semibold uppercase tracking-wide text-xs" style={{ color: "var(--admin-text-faint)" }}>Variable reference</div>
                {editing.page_type === "state"
                  ? <div><code className="font-mono">{"{{state_name}}"}</code> — the state name</div>
                  : <>
                      <div><code className="font-mono">{"{{city_name}}"}</code> — city/area name</div>
                      <div><code className="font-mono">{"{{state_name}}"}</code> — parent state name</div>
                    </>
                }
                <div className="pt-1.5" style={{ borderTop: "1px solid var(--admin-border)", color: "var(--admin-text-faint)" }}>
                  JSON sections (<code className="font-mono">issues</code>, <code className="font-mono">key_stats</code>) must instruct the model to return raw JSON only.
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-5" style={{ borderTop: "1px solid var(--admin-border)" }}>
            <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "Save Prompt"}
            </button>
            <button onClick={closeEdit} className="admin-btn admin-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Prompts table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Section</th>
              <th scope="col" className="hidden md:table-cell">Prompt preview</th>
              <th scope="col">Model</th>
              <th scope="col">Updated</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={editId === p.id ? { background: "rgba(89,37,244,0.04)" } : undefined}>
                <td>
                  <div className="font-semibold text-sm" style={{ color: "var(--admin-text-primary)" }}>{p.label}</div>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--admin-text-faint)" }}>{p.section_key}</div>
                </td>
                <td className="hidden md:table-cell" style={{ maxWidth: "360px" }}>
                  <div className="text-xs truncate" style={{ color: "var(--admin-text-muted)", fontFamily: "monospace" }}>
                    {p.prompt.split("\n")[0]}
                  </div>
                </td>
                <td>
                  <span className="admin-badge admin-badge-indigo">{p.model}</span>
                </td>
                <td>
                  <span className="text-xs" style={{ color: "var(--admin-text-faint)" }}>
                    {new Date(p.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => openEdit(p)}
                    className="admin-icon-btn"
                    aria-label={`Edit prompt: ${p.label}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
