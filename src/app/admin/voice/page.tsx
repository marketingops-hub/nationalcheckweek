"use client";

import { useEffect, useState } from "react";
import VoiceBlock, { VOICE_DEFAULTS, type VoiceBlockData } from "@/components/VoiceBlock";

type Fields = Omit<VoiceBlockData, "enabled"> & { enabled: boolean };

function toFields(raw: Record<string, string>): Fields {
  return {
    heading:  raw.voice_heading  ?? VOICE_DEFAULTS.heading,
    body:     raw.voice_body     ?? VOICE_DEFAULTS.body,
    cta_text: raw.voice_cta_text ?? VOICE_DEFAULTS.cta_text,
    cta_url:  raw.voice_cta_url  ?? VOICE_DEFAULTS.cta_url,
    enabled:  (raw.voice_enabled ?? "true") !== "false",
  };
}

const INPUT  = "swa-form-input";
const LABEL  = "swa-form-label";
const BTN_P  = "swa-btn swa-btn--primary";
const BTN_S  = "swa-btn swa-btn--ghost";

export default function AdminVoicePage() {
  const [fields,   setFields]   = useState<Fields>(() => toFields({}));
  const [original, setOriginal] = useState<Fields>(() => toFields({}));
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    fetch("/api/admin/voice")
      .then(r => r.json())
      .then((d: Record<string, string>) => {
        const f = toFields(d);
        setFields(f);
        setOriginal(f);
      })
      .catch(() => setError("Could not load voice block settings."))
      .finally(() => setLoading(false));
  }, []);

  const isDirty = JSON.stringify(fields) !== JSON.stringify(original);

  function set<K extends keyof Fields>(k: K, v: Fields[K]) {
    setFields(p => ({ ...p, [k]: v }));
    setSuccess("");
  }

  async function handleSave() {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/voice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading:  fields.heading,
          body:     fields.body,
          cta_text: fields.cta_text,
          cta_url:  fields.cta_url,
          enabled:  fields.enabled ? "true" : "false",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      setOriginal(fields);
      setSuccess("Voice block saved successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setFields(original);
    setSuccess("");
    setError("");
  }

  function handleResetToDefaults() {
    setFields(toFields({}));
    setSuccess("");
    setError("");
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Your Voice Block</h1>
          <p className="swa-page-subtitle">
            Edits the pink CTA block shown on every Issue page — links to{" "}
            <a href="/your-voice" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--admin-accent)" }}>/your-voice ↗</a>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/your-voice" target="_blank" rel="noopener noreferrer"
            className={BTN_S} style={{ textDecoration: "none" }}>
            Preview page ↗
          </a>
          {isDirty && (
            <button onClick={handleSave} disabled={saving} className={BTN_P}
              style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {error   && <div className="swa-alert swa-alert--error"   style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="swa-alert swa-alert--success" style={{ marginBottom: 20 }}>{success}</div>}

      {loading ? (
        <div style={{ color: "var(--admin-text-faint)", padding: 24 }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 24 }}>

          {/* Enable / disable toggle */}
          <div className="swa-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--admin-text-primary)" }}>
                  Show block on issue pages
                </div>
                <div style={{ fontSize: 12, color: "var(--admin-text-faint)", marginTop: 4 }}>
                  When off, the pink Voice CTA is hidden from all issues.
                </div>
              </div>
              <button
                type="button"
                onClick={() => set("enabled", !fields.enabled)}
                className={`swa-toggle${fields.enabled ? " on" : ""}`}
                aria-pressed={fields.enabled}
              />
            </div>
          </div>

          {/* Content */}
          <div className="swa-card">
            <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase",
              color: "var(--admin-text-faint)", marginBottom: 20 }}>Block Content</div>

            <div style={{ display: "grid", gap: 20 }}>
              <div>
                <label className={LABEL}>Heading</label>
                <input className={INPUT} value={fields.heading}
                  onChange={e => set("heading", e.target.value)}
                  placeholder="Your voice matters" />
              </div>

              <div>
                <label className={LABEL}>Body Text</label>
                <textarea className={INPUT} value={fields.body} rows={6}
                  onChange={e => set("body", e.target.value)}
                  placeholder="We are inviting educators…"
                  style={{ resize: "vertical", fontFamily: "inherit" }} />
                <div style={{ fontSize: 11, color: "var(--admin-text-faint)", marginTop: 4 }}>
                  Use a blank line to create separate paragraphs.
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="swa-card">
            <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase",
              color: "var(--admin-text-faint)", marginBottom: 20 }}>Call-to-Action Button</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label className={LABEL}>Button Label</label>
                <input className={INPUT} value={fields.cta_text}
                  onChange={e => set("cta_text", e.target.value)}
                  placeholder="Join the Conversation" />
              </div>
              <div>
                <label className={LABEL}>Button URL</label>
                <input className={INPUT} value={fields.cta_url}
                  onChange={e => set("cta_url", e.target.value)}
                  placeholder="/your-voice" />
                <div style={{ fontSize: 11, color: "var(--admin-text-faint)", marginTop: 4 }}>
                  Use <code>/your-voice</code> for the internal page or paste an external URL.
                </div>
              </div>
            </div>
          </div>

          {/* Preview — renders the actual VoiceBlock component so it always matches production */}
          <div className="swa-card">
            <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase",
              color: "var(--admin-text-faint)", marginBottom: 16 }}>Live Preview</div>
            <VoiceBlock data={{
              heading:  fields.heading,
              body:     fields.body,
              cta_text: fields.cta_text,
              cta_url:  fields.cta_url,
              enabled:  fields.enabled ? "true" : "false",
            }} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, paddingBottom: 40 }}>
            {isDirty && (
              <button onClick={handleSave} disabled={saving} className={BTN_P}
                style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            )}
            {isDirty && (
              <button onClick={handleDiscard} className={BTN_S}>Discard Changes</button>
            )}
            <button onClick={handleResetToDefaults} className={BTN_S}
              title="Resets to factory default text — you will still need to Save">
              Reset to factory defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
