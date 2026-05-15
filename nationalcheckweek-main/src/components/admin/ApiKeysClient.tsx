"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { FormField, TextInput, Select, Button, Alert } from "@/components/shared/forms";
import { useFormState, useAutoDismiss } from "@/hooks/shared";
import { useValidation } from "@/hooks/shared/useValidation";
import { apiKeyCreateSchema } from "@/lib/adminSchemas";
import {
  DangerConfirm,
  FormPanelHeader,
  fmtDate,
  maskKey,
  type AdminApiKey,
} from "@/components/admin/ui";

const PROVIDER_BADGE: Record<string, string> = {
  openai:    "swa-badge--success",
  anthropic: "swa-badge--primary",
  google:    "swa-badge--warning",
  firecrawl: "swa-badge--error",
  other:     "swa-badge--info",
};

export default function ApiKeysClient({ initialKeys }: { initialKeys: AdminApiKey[] }) {
  const [keys, setKeys] = useState<AdminApiKey[]>(initialKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { formData, handleChange, resetForm } = useFormState({
    label: "",
    provider: "openai",
    keyValue: "",
  });

  const { errors: validationErrors, validateForm, clearError, clearErrors } = useValidation(apiKeyCreateSchema);

  // Auto-dismiss success messages after 5 seconds
  useAutoDismiss(() => setSuccess(""), 5000, [success]);

  const activeCount = keys.filter(k => k.is_active).length;
  const providerCount = new Set(keys.map(k => k.provider)).size;

  const filtered = useMemo(() => {
    if (!search) return keys;
    const q = search.toLowerCase();
    return keys.filter(k =>
      k.label.toLowerCase().includes(q) || k.provider.toLowerCase().includes(q)
    );
  }, [keys, search]);

  function clearMessages() { setError(""); setSuccess(""); }

  function closeCreatePanel() {
    setShowCreate(false);
    resetForm();
    clearErrors();
    clearMessages();
  }

  async function handleCreate() {
    if (!validateForm(formData)) return;

    setBusy(true); clearMessages();
    const sb = createClient();
    try {
      const { data, error: err } = await sb
        .from("api_keys")
        .insert({ label: formData.label, provider: formData.provider, key_value: formData.keyValue, is_active: true })
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

  return (
    <div>
      {/* Stat Cards */}
      <div className="swa-stat-grid" style={{ marginBottom: 24 }}>
        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">Total Keys</span>
            <span className="swa-badge swa-badge--primary">
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>vpn_key</span>
              All
            </span>
          </div>
          <div className="swa-stat-card__value">{keys.length}</div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">API keys configured</span>
          </div>
        </div>

        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">Active Keys</span>
            <span className="swa-badge swa-badge--success">In use</span>
          </div>
          <div className="swa-stat-card__value">{activeCount}</div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">
              {keys.length > 0
                ? `${Math.round((activeCount / keys.length) * 100)}% active`
                : "No keys yet"}
            </span>
          </div>
        </div>

        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">Providers</span>
            <span className="swa-badge swa-badge--info">Integrations</span>
          </div>
          <div className="swa-stat-card__value">{providerCount}</div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">Distinct providers</span>
          </div>
        </div>
      </div>

      {/* Global feedback */}
      {!showCreate && error && <Alert variant="error" message={error} onDismiss={() => setError("")} />}
      {!showCreate && success && <Alert variant="success" message={success} onDismiss={() => setSuccess("")} />}

      {/* Add Key panel */}
      {showCreate && (
        <div className="swa-card" role="region" aria-label="Add API key" style={{ marginBottom: 24 }}>
          <FormPanelHeader
            title="Add API Key"
            subtitle="Keys are stored encrypted and only accessible to admin users."
            onClose={closeCreatePanel}
            closeLabel="Close add API key form"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <FormField label="Label" required error={validationErrors.label} htmlFor="apikey-label">
              <TextInput
                id="apikey-label"
                name="label"
                value={formData.label}
                onChange={(e) => { handleChange(e); clearError("label"); }}
                placeholder="e.g. OpenAI Production"
                error={!!validationErrors.label}
                testId="apikey-label-input"
              />
            </FormField>

            <FormField label="Provider" htmlFor="apikey-provider">
              <Select
                id="apikey-provider"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                testId="apikey-provider-select"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="firecrawl">Firecrawl</option>
                <option value="other">Other</option>
              </Select>
            </FormField>

            <FormField label="API Key" required error={validationErrors.keyValue} htmlFor="apikey-value">
              <TextInput
                id="apikey-value"
                name="keyValue"
                type="password"
                value={formData.keyValue}
                onChange={(e) => { handleChange(e); clearError("keyValue"); }}
                placeholder="sk-..."
                error={!!validationErrors.keyValue}
                testId="apikey-value-input"
              />
            </FormField>
          </div>

          {error && <Alert variant="error" message={error} />}

          <div style={{ display: "flex", gap: 10 }}>
            <Button
              onClick={handleCreate}
              loading={busy}
              variant="primary"
              testId="add-key-button"
            >
              Add Key
            </Button>
            <Button
              onClick={closeCreatePanel}
              variant="ghost"
              testId="cancel-button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar: Search + Add button */}
      {!showCreate && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              className="swa-search"
              placeholder="Search keys…"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{ fontSize: 13, color: "var(--color-text-faint)" }}>
              {filtered.length} of {keys.length} keys
            </span>
          </div>
          <Button
            onClick={() => { setShowCreate(true); clearMessages(); clearErrors(); }}
            variant="primary"
            testId="show-add-form-button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add API Key
          </Button>
        </div>
      )}

      {/* Keys table / empty state */}
      {filtered.length === 0 ? (
        <div className="swa-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--color-text-faint)", marginBottom: 12, display: "block" }}
          >
            vpn_key
          </span>
          <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
            {keys.length === 0 ? "No API keys yet" : "No keys match your search"}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
            {keys.length === 0
              ? "Add your first key to enable AI content generation."
              : `No results for "${search}"`}
          </div>
          {keys.length === 0 && (
            <Button
              onClick={() => { setShowCreate(true); clearMessages(); }}
              variant="primary"
            >
              Add your first key
            </Button>
          )}
        </div>
      ) : (
        <div className="swa-card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="swa-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Provider</th>
                <th scope="col">Key</th>
                <th scope="col">Added</th>
                <th scope="col">Status</th>
                <th scope="col" style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(key => {
                const badgeCls = PROVIDER_BADGE[key.provider] ?? PROVIDER_BADGE.other;
                const isRevealed = revealed.has(key.id);
                return (
                  <tr key={key.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {key.label}
                      </div>
                    </td>
                    <td>
                      <span className={`swa-badge ${badgeCls}`} style={{ textTransform: "capitalize" }}>
                        {key.provider}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--color-text-muted)" }}>
                          {isRevealed ? key.key_value : maskKey(key.key_value)}
                        </span>
                        <button
                          onClick={() => toggleReveal(key.id)}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-primary-pale)",
                            color: "var(--color-primary)",
                            border: "1px solid var(--color-primary-light)",
                            cursor: "pointer",
                          }}
                          aria-label={isRevealed ? `Hide key for ${key.label}` : `Show key for ${key.label}`}
                        >
                          {isRevealed ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        {fmtDate(key.created_at)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(key)}
                        className={`swa-badge ${key.is_active ? "swa-badge--success" : "swa-badge--error"}`}
                        style={{ cursor: "pointer", border: "none" }}
                        aria-label={`Toggle ${key.label} ${key.is_active ? "inactive" : "active"}`}
                      >
                        {key.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {confirmDelete === key.id ? (
                        <DangerConfirm
                          message={<>Delete <strong>{key.label}</strong>?</>}
                          onConfirm={() => handleDelete(key)}
                          onCancel={() => setConfirmDelete(null)}
                          busy={busy}
                        />
                      ) : (
                        <button
                          onClick={() => { setConfirmDelete(key.id); clearMessages(); }}
                          disabled={busy}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 34,
                            height: 34,
                            borderRadius: "var(--radius-sm)",
                            background: "transparent",
                            color: "var(--color-error)",
                            border: "1px solid transparent",
                            cursor: "pointer",
                          }}
                          aria-label={`Delete API key ${key.label}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Security info callout */}
      <div
        style={{
          marginTop: 24,
          borderRadius: "var(--radius-lg)",
          padding: 16,
          background: "var(--color-primary-pale)",
          border: "1px solid var(--color-primary-light)",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--color-primary)" }}>Security note:</strong>{" "}
          API keys are stored encrypted at rest in Supabase and are only accessible to authenticated admin users.
          Keys marked{" "}
          <span style={{ color: "var(--color-success)", fontWeight: 600 }}>Active</span>{" "}
          will be used by the AI content generation tools.
        </p>
      </div>
    </div>
  );
}
