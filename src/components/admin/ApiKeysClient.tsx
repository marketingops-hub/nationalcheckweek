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

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const INPUT_STYLE = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };

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
    openai:    { bg: "#0D2D1A", color: "#6EE7B7" },
    anthropic: { bg: "#1C2A3A", color: "#58A6FF" },
    google:    { bg: "#2D1A0E", color: "#F0883E" },
    other:     { bg: "#21262D", color: "#8B949E" },
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: "#6E7681" }}>{keys.length} key{keys.length !== 1 ? "s" : ""} configured</span>
        <button
          onClick={() => { setShowCreate(true); clearMessages(); }}
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "#238636", color: "#FFFFFF" }}
        >
          + Add API Key
        </button>
      </div>

      {/* Feedback */}
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>{error}</div>}
      {success && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#0D2D1A", color: "#6EE7B7", border: "1px solid #166534" }}>{success}</div>}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: "#161B22", border: "1px solid #30363D" }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: "#E6EDF3" }}>Add API Key</h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#6E7681" }}>Label</label>
              <input className={INPUT} style={INPUT_STYLE} value={label}
                onChange={e => setLabel(e.target.value)} placeholder="e.g. OpenAI Production Key" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#6E7681" }}>Provider</label>
              <select className={INPUT} style={INPUT_STYLE} value={provider} onChange={e => setProvider(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#6E7681" }}>API Key</label>
              <input type="password" className={INPUT} style={INPUT_STYLE} value={keyValue}
                onChange={e => setKeyValue(e.target.value)} placeholder="sk-..." />
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded text-xs" style={{ background: "#3D1515", color: "#F87171" }}>{error}</div>}
            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={busy}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{ background: "#238636", color: "#FFFFFF", opacity: busy ? 0.6 : 1 }}>
                {busy ? "Saving…" : "Add Key"}
              </button>
              <button onClick={() => { setShowCreate(false); clearMessages(); }}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{ background: "#21262D", color: "#C9D1D9" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys table */}
      {keys.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: "#161B22", border: "1px solid #21262D" }}>
          <div className="text-3xl mb-3">🔑</div>
          <p className="text-sm font-medium mb-1" style={{ color: "#C9D1D9" }}>No API keys yet</p>
          <p className="text-xs" style={{ color: "#484F58" }}>Add a key above to enable AI content generation.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161B22", borderBottom: "1px solid #21262D" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Label</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Provider</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>Key</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>Added</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Status</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key, idx) => {
                const pc = PROVIDER_COLORS[key.provider] ?? PROVIDER_COLORS.other;
                const isRevealed = revealed.has(key.id);
                return (
                  <tr key={key.id} style={{ background: idx % 2 === 0 ? "#0D1117" : "#161B22", borderBottom: "1px solid #21262D" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#C9D1D9" }}>{key.label}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded capitalize" style={{ background: pc.bg, color: pc.color }}>
                        {key.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: "#6E7681" }}>
                          {isRevealed ? key.key_value : maskKey(key.key_value)}
                        </span>
                        <button
                          onClick={() => toggleReveal(key.id)}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: "#21262D", color: "#8B949E" }}
                        >
                          {isRevealed ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "#6E7681" }}>{fmt(key.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(key)}
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{
                          background: key.is_active ? "#0D2D1A" : "#21262D",
                          color: key.is_active ? "#6EE7B7" : "#484F58",
                          border: `1px solid ${key.is_active ? "#166534" : "#30363D"}`,
                        }}
                      >
                        {key.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(key)}
                        disabled={busy}
                        className="text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 rounded-xl p-4" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <p className="text-xs" style={{ color: "#6E7681" }}>
          <strong style={{ color: "#8B949E" }}>Security note:</strong> API keys are stored encrypted at rest in Supabase and are only accessible to authenticated admin users. Keys marked <span style={{ color: "#6EE7B7" }}>Active</span> will be used by the AI content generation tools. Toggle a key to <span style={{ color: "#484F58" }}>Inactive</span> to disable it without deleting it.
        </p>
      </div>
    </div>
  );
}
