"use client";

import ColorPicker from "../ColorPicker";
import type { CTASettings } from "./types";

interface CTATabProps {
  settings: CTASettings;
  onChange: (settings: CTASettings) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export default function CTATab({ settings, onChange, onSave, saving }: CTATabProps) {
  return (
    <div className="swa-card">
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>CTA Banner Settings</h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <label className="swa-form-label">Eyebrow Text</label>
          <input
            type="text"
            value={settings.eyebrow_text || ""}
            onChange={(e) => onChange({ ...settings, eyebrow_text: e.target.value })}
            className="swa-form-input"
            placeholder="Join the Movement"
          />
        </div>

        <div>
          <label className="swa-form-label">Heading</label>
          <input
            type="text"
            value={settings.heading_text || ""}
            onChange={(e) => onChange({ ...settings, heading_text: e.target.value })}
            className="swa-form-input"
            placeholder="Ready to Make Student Wellbeing a Priority?"
          />
        </div>

        <div>
          <label className="swa-form-label">Description</label>
          <textarea
            value={settings.description_text || ""}
            onChange={(e) => onChange({ ...settings, description_text: e.target.value })}
            className="swa-form-textarea"
            rows={3}
            placeholder="Join 1,200+ schools across Australia..."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="swa-form-label">Primary Button Text</label>
            <input
              type="text"
              value={settings.primary_cta_text || ""}
              onChange={(e) => onChange({ ...settings, primary_cta_text: e.target.value })}
              className="swa-form-input"
              placeholder="Register Your School"
            />
          </div>
          <div>
            <label className="swa-form-label">Primary Button Link</label>
            <input
              type="text"
              value={settings.primary_cta_link || ""}
              onChange={(e) => onChange({ ...settings, primary_cta_link: e.target.value })}
              className="swa-form-input"
              placeholder="/events"
            />
          </div>
          <div>
            <label className="swa-form-label">Secondary Button Text</label>
            <input
              type="text"
              value={settings.secondary_cta_text || ""}
              onChange={(e) => onChange({ ...settings, secondary_cta_text: e.target.value })}
              className="swa-form-input"
              placeholder="Download Resources"
            />
          </div>
          <div>
            <label className="swa-form-label">Secondary Button Link</label>
            <input
              type="text"
              value={settings.secondary_cta_link || ""}
              onChange={(e) => onChange({ ...settings, secondary_cta_link: e.target.value })}
              className="swa-form-input"
              placeholder="/about"
            />
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Colors</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <ColorPicker
              label="Background Color"
              value={settings.background_color || "#0B1D35"}
              onChange={(color) => onChange({ ...settings, background_color: color })}
              description="CTA banner background"
            />
            <ColorPicker
              label="Text Color"
              value={settings.text_color || "#FFFFFF"}
              onChange={(color) => onChange({ ...settings, text_color: color })}
              description="Main text color"
            />
            <ColorPicker
              label="Eyebrow Color"
              value={settings.eyebrow_color || "#29B8E8"}
              onChange={(color) => onChange({ ...settings, eyebrow_color: color })}
              description="Eyebrow text color"
            />
            <ColorPicker
              label="Primary Button Background"
              value={settings.primary_button_bg || "#29B8E8"}
              onChange={(color) => onChange({ ...settings, primary_button_bg: color })}
              description="Primary button color"
            />
            <ColorPicker
              label="Primary Button Text"
              value={settings.primary_button_text || "#FFFFFF"}
              onChange={(color) => onChange({ ...settings, primary_button_text: color })}
              description="Primary button text"
            />
            <ColorPicker
              label="Secondary Button Background"
              value={settings.secondary_button_bg || "#FFFFFF"}
              onChange={(color) => onChange({ ...settings, secondary_button_bg: color })}
              description="Secondary button color"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
          <button onClick={onSave} disabled={saving} className="swa-btn swa-btn--primary">
            {saving ? "Saving..." : "Save CTA Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
