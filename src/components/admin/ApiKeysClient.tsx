"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AdminField,
  DangerConfirm,
  FormPanelHeader,
  INPUT_CLS,
  INPUT_STYLE,
  inputStyle,
  fmtDate,
  maskKey,
  type AdminApiKey,
  type FieldErrors,
} from "@/components/admin/ui";

// ---------------------------------------------------------------------------
// Module-level constants (not recreated on every render)
// ---------------------------------------------------------------------------

/** Provider badge colours keyed by provider slug. */
const PROVIDER_COLORS: Record<string, { bg: string; color: string }> = {
  openai:    { bg: "#dcfce7",              color: "#15803d" },
  anthropic: { bg: "rgba(89,37,244,0.1)", color: "#5925f4" },
  google:    { bg: "#fef9c3",              color: "#854d0e" },
  other:     { bg: "#f1f5f9",              color: "#475569" },
};

/** Validates the add-key form. Returns a FieldErrors map (empty = valid). */
function validateCreate(label: string, keyValue: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!label.trim()) errs.label = "Label is required.";
  if (!keyValue.trim()) errs.keyValue = "API key value is required.";
  else if (keyValue.trim().length < 8) errs.keyValue = "Key seems too short — check it's correct.";
  return errs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApiKeysClient({ initialKeys }: { initialKeys: AdminApiKey[] }) {
  // ── All useState calls grouped at the top (Rules of Hooks) ──
  const [keys, setKeys]               = useState<AdminApiKey[]>(initialKeys);
  const [showCreate, setShowCreate]   = useState(false);
  const [revealed, setRevealed]       = useState<Set<string>>(new Set());
  const [label, setLabel]             = useState("");
  const [provider, setProvider]       = useState("openai");
  const [keyValue, setKeyValue]       = useState("");
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Helpers ──

  function clearMessages() { setError(""); setSuccess(""); }

  function clearFieldError(key: string) {
    setFieldErrors(prev => prev[key] ? { ...prev, [key]: "" } : prev);
  }

  function closeCreatePanel() {
    setShowCreate(false);
    setLabel(""); setProvider("openai"); setKeyValue("");
    setFieldErrors({});
    clearMessages();
  }

  // ── Mutation handlers ──

  async function handleCreate() {
    const errs = validateCreate(label, keyValue);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { data, error: err } = await sb
        .from("api_keys")
        .insert({ label, provider, key_value: keyValue, is_active: true })
        .select()
        .single();
      if (err) { setError(err.message); return; }
      setKeys(k => [data, ...k]);
      setSuccess(`API key "${data.label}" added.`);
      closeCreatePanel();
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(key: AdminApiKey) {
    const sb = createClient();
    const { error: err } = await sb
      .from("api_keys")
      .update({ is_active: !key.is_active })
      .eq("id", key.id);
    if (err) { setError(err.message); return; }
    setKeys(k => k.map(k2 => k2.id === key.id ? { ...k2, is_active: !k2.is_active } : k2));
  }

  async function handleDelete(key: AdminApiKey) {
    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { error: err } = await sb.from("api_keys").delete().eq("id", key.id);
      if (err) { setError(err.message); return; }
      setKeys(k => k.filter(k2 => k2.id !== key.id));
      setSuccess(`Key "${key.label}" deleted.`);
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  }

  function toggleReveal(id: string) {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Render ──

  return (
    <div className="space-y-8">
      {/* Global feedback (hidden while create panel is open) */}
      {!showCreate && error   && <div className="admin-alert admin-alert-error"  role="alert">{error}</div>}
      {!showCreate && success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* ── Add Key inline panel ── */}
      {showCreate && (
        <div className="admin-form-panel" role="region" aria-label="Add API key">
          <FormPanelHeader
            title="Add API Key"
            subtitle="Keys are stored encrypted and only accessible to admin users."
            onClose={closeCreatePanel}
            closeLabel="Close add API key form"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <AdminField id="apikey-label" label="Label" error={fieldErrors.label}>
              <input
                id="apikey-label"
                className={INPUT_CLS}
                style={inputStyle(!!fieldErrors.label)}
                value={label}
                onChange={e => { setLabel(e.target.value); clearFieldError("label"); }}
                placeholder="e.g. OpenAI Production"
                autoComplete="off"
              />
            </AdminField>

            <AdminField id="apikey-provider" label="Provider">
              <select
                id="apikey-provider"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                value={provider}
                onChange={e => setProvider(e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="other">Other</option>
              </select>
            </AdminField>

            <AdminField id="apikey-value" label="API Key" error={fieldErrors.keyValue}>
              <input
                id="apikey-value"
                type="password"
                className={INPUT_CLS}
                style={inputStyle(!!fieldErrors.keyValue)}
                value={keyValue}
                onChange={e => { setKeyValue(e.target.value); clearFieldError("keyValue"); }}
                placeholder="sk-..."
                autoComplete="off"
              />
            </AdminField>
          </div>

          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={busy}
              className="admin-btn admin-btn-primary"
              style={{ opacity: busy ? 0.6 : 1 }}
            >
              {busy ? "Saving…" : "Add Key"}
            </button>
            <button onClick={closeCreatePanel} className="admin-btn admin-btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      {!showCreate && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--admin-text-subtle)" }}>
            {keys.length} key{keys.length !== 1 ? "s" : ""} configured
          </span>
          <button
            onClick={() => { setShowCreate(true); clearMessages(); setFieldErrors({}); }}
            className="admin-btn admin-btn-primary"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add API Key
          </button>
        </div>
      )}

      {/* ── Keys table / empty state ── */}
      {keys.length === 0 ? (
        <div className="admin-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          <h3>No API keys yet</h3>
          <p>Add a key above to enable AI content generation.</p>
          <button
            onClick={() => { setShowCreate(true); clearMessages(); }}
            className="admin-btn admin-btn-primary"
          >
            Add your first key
          </button>
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
              {keys.map(key => {
                const pc = PROVIDER_COLORS[key.provider] ?? PROVIDER_COLORS.other;
                const isRevealed = revealed.has(key.id);
                return (
                  <tr key={key.id}>
                    <td>
                      <div className="text-[15px] font-semibold" style={{ color: "var(--admin-text-primary)" }}>
                        {key.label}
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge capitalize" style={{ background: pc.bg, color: pc.color }}>
                        {key.provider}
                      </span>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>
                          {isRevealed ? key.key_value : maskKey(key.key_value)}
                        </span>
                        <button
                          onClick={() => toggleReveal(key.id)}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{ background: "var(--admin-bg-elevated)", color: "var(--admin-text-subtle)", border: "1px solid var(--admin-border)" }}
                          aria-label={isRevealed ? `Hide key for ${key.label}` : `Show key for ${key.label}`}
                        >
                          {isRevealed ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                        {fmtDate(key.created_at)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(key)}
                        className={`admin-badge cursor-pointer ${key.is_active ? "admin-badge-green" : "admin-badge-slate"}`}
                        aria-label={`Toggle ${key.label} ${key.is_active ? "inactive" : "active"}`}
                      >
                        {key.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      {confirmDelete === key.id ? (
                        <DangerConfirm
                          message={<>Delete <strong>{key.label}</strong>?</>}
                          onConfirm={() => handleDelete(key)}
                          onCancel={() => setConfirmDelete(null)}
                          busy={busy}
                        />
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setConfirmDelete(key.id); clearMessages(); }}
                            disabled={busy}
                            className="admin-icon-btn"
                            aria-label={`Delete API key ${key.label}`}
                            style={{ color: "var(--admin-danger)" }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/>
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

      {/* ── Security info callout ── */}
      <div className="rounded-xl p-4" style={{ background: "var(--admin-accent-bg)", border: "1px solid rgba(89,37,244,0.12)" }}>
        <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
          <strong style={{ color: "var(--admin-accent)" }}>Security note:</strong>{" "}
          API keys are stored encrypted at rest in Supabase and are only accessible to authenticated admin users.
          Keys marked{" "}
          <span style={{ color: "var(--admin-success-light)", fontWeight: 600 }}>Active</span>{" "}
          will be used by the AI content generation tools.
        </p>
      </div>
    </div>
  );
}
