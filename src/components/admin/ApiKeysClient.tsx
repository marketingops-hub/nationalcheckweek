"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ApiKey {
  id: string;
  label: string;
  provider: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
}

const INPUT = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all";
const INPUT_STYLE = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };

function maskKey(k: string) {
  if (k.length <= 8) return "••••••••";
  return k.slice(0, 6) + "••••••••••••••••" + k.slice(-4);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState("openai");
  const [keyValue, setKeyValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearMessages() { setError(""); setSuccess(""); }

  async function handleCreate() {
    if (!label || !keyValue) { setError("Label and key are required."); return; }
    setBusy(true); clearMessages();
    const sb = createClient();
    const { data, error: err } = await sb
      .from("api_keys")
      .insert({ label, provider, key_value: keyValue, is_active: true })
      .select()
      .single();
    if (err) { setError(err.message); setBusy(false); return; }
    setKeys(k => [data, ...k]);
    setLabel(""); setProvider("openai"); setKeyValue("");
    setShowCreate(false);
    setSuccess(`API key "${data.label}" added.`);
    setBusy(false);
  }

  async function handleToggle(key: ApiKey) {
    const sb = createClient();
    const { error: err } = await sb
      .from("api_keys")
      .update({ is_active: !key.is_active })
      .eq("id", key.id);
    if (err) { setError(err.message); return; }
    setKeys(k => k.map(k2 => k2.id === key.id ? { ...k2, is_active: !k2.is_active } : k2));
  }

  async function handleDelete(key: ApiKey) {
    if (!confirm(`Delete API key "${key.label}"? This cannot be undone.`)) return;
    setBusy(true); clearMessages();
    const sb = createClient();
    const { error: err } = await sb.from("api_keys").delete().eq("id", key.id);
    if (err) { setError(err.message); setBusy(false); return; }
    setKeys(k => k.filter(k2 => k2.id !== key.id));
    setSuccess(`Key "${key.label}" deleted.`);
    setBusy(false);
  }

  function toggleReveal(id: string) {
    setRevealed(r => {
      const next = new Set(r);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const PROVIDER_COLORS: Record<string, { bg: string; color: string }> = {
    openai:    { bg: "#dcfce7", color: "#15803d" },
    anthropic: { bg: "rgba(89,37,244,0.1)", color: "#5925f4" },
    google:    { bg: "#fef9c3", color: "#854d0e" },
    other:     { bg: "#f1f5f9", color: "#475569" },
  };
  const LABEL_CLS = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
  const LABEL_STYLE = { color: "var(--admin-text-subtle)" };
  const INPUT_ERR = { background: "#fff", border: "1px solid var(--admin-danger)", color: "var(--admin-text-primary)", boxShadow: "0 0 0 3px rgba(220,38,38,0.12)" };
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function validateCreate() {
    const errs: Record<string, string> = {};
    if (!label.trim()) errs.label = "Label is required.";
    if (!keyValue.trim()) errs.keyValue = "API key value is required.";
    else if (keyValue.trim().length < 8) errs.keyValue = "Key seems too short — check it's correct.";
    return errs;
  }

  return (
    <div className="space-y-8">
      {/* Feedback */}
      {!showCreate && error   && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {!showCreate && success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* Create inline panel */}
      {showCreate && (
        <div className="admin-form-panel" role="region" aria-label="Add API key">
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <div>
              <h2 style={{ color: 'var(--admin-text-primary)', margin: 0, border: 'none', padding: 0 }}>Add API Key</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--admin-text-subtle)' }}>Keys are stored encrypted and only accessible to admin users.</p>
            </div>
            <button onClick={() => { setShowCreate(false); clearMessages(); setFieldErrors({}); }} className="admin-icon-btn" aria-label="Close add API key form">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="apikey-label" className={LABEL_CLS} style={LABEL_STYLE}>Label</label>
              <input id="apikey-label" className={INPUT} style={fieldErrors.label ? INPUT_ERR : INPUT_STYLE}
                value={label} onChange={e => { setLabel(e.target.value); setFieldErrors(f => ({ ...f, label: "" })); }}
                placeholder="e.g. OpenAI Production" autoComplete="off" />
              {fieldErrors.label && <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.label}</p>}
            </div>
            <div>
              <label htmlFor="apikey-provider" className={LABEL_CLS} style={LABEL_STYLE}>Provider</label>
              <select id="apikey-provider" className={INPUT} style={INPUT_STYLE} value={provider} onChange={e => setProvider(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="apikey-value" className={LABEL_CLS} style={LABEL_STYLE}>API Key</label>
              <input id="apikey-value" type="password" className={INPUT} style={fieldErrors.keyValue ? INPUT_ERR : INPUT_STYLE}
                value={keyValue} onChange={e => { setKeyValue(e.target.value); setFieldErrors(f => ({ ...f, keyValue: "" })); }}
                placeholder="sk-..." autoComplete="off" />
              {fieldErrors.keyValue && <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.keyValue}</p>}
            </div>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex gap-3">
            <button onClick={() => { const e = validateCreate(); if (Object.keys(e).length) { setFieldErrors(e); return; } handleCreate(); }} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Add Key"}
            </button>
            <button onClick={() => { setShowCreate(false); clearMessages(); setFieldErrors({}); }} className="admin-btn admin-btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!showCreate && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--admin-text-subtle)" }}>{keys.length} key{keys.length !== 1 ? "s" : ""} configured</span>
          <button onClick={() => { setShowCreate(true); clearMessages(); setFieldErrors({}); }} className="admin-btn admin-btn-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add API Key
          </button>
        </div>
      )}

      {/* Keys table */}
      {keys.length === 0 ? (
        <div className="admin-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          <h3>No API keys yet</h3>
          <p>Add a key above to enable AI content generation.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Provider</th>
                <th scope="col" className="hidden md:table-cell">Key</th>
                <th scope="col" className="hidden md:table-cell">Added</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const pc = PROVIDER_COLORS[key.provider] ?? PROVIDER_COLORS.other;
                const isRevealed = revealed.has(key.id);
                return (
                  <tr key={key.id}>
                    <td>
                      <div className="text-[15px] font-semibold" style={{ color: "var(--admin-text-primary)" }}>{key.label}</div>
                    </td>
                    <td>
                      <span className="admin-badge capitalize" style={{ background: pc.bg, color: pc.color }}>{key.provider}</span>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>
                          {isRevealed ? key.key_value : maskKey(key.key_value)}
                        </span>
                        <button onClick={() => toggleReveal(key.id)}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{ background: "var(--admin-bg-elevated)", color: "var(--admin-text-subtle)", border: "1px solid var(--admin-border)" }}>
                          {isRevealed ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{fmt(key.created_at)}</span>
                    </td>
                    <td>
                      <button onClick={() => handleToggle(key)}
                        className={`admin-badge cursor-pointer ${key.is_active ? "admin-badge-green" : "admin-badge-slate"}`}>
                        {key.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      {confirmDelete === key.id ? (
                        <div className="admin-danger-confirm">
                          <span>Delete <strong>{key.label}</strong>?</span>
                          <button onClick={() => handleDelete(key)} disabled={busy}
                            className="admin-btn admin-btn-danger" style={{ padding: "4px 10px", fontSize: "0.75rem", opacity: busy ? 0.6 : 1 }}>
                            {busy ? "Deleting…" : "Yes, delete"}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="admin-btn admin-btn-secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setConfirmDelete(key.id); clearMessages(); }} disabled={busy}
                            className="admin-icon-btn" aria-label={`Delete API key ${key.label}`}
                            style={{ color: "var(--admin-danger)" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 rounded-xl p-4" style={{ background: "var(--admin-accent-bg)", border: "1px solid rgba(89,37,244,0.12)" }}>
        <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
          <strong style={{ color: "var(--admin-accent)" }}>Security note:</strong> API keys are stored encrypted at rest in Supabase and are only accessible to authenticated admin users. Keys marked <span style={{ color: "var(--admin-success-light)", fontWeight: 600 }}>Active</span> will be used by the AI content generation tools.
        </p>
      </div>
    </div>
  );
}
