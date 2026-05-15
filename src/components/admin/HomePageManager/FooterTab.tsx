"use client";

import ImageUpload from "../ImageUpload";
import type { FooterSettings } from "./types";

interface FooterTabProps {
  settings: FooterSettings;
  onChange: (settings: FooterSettings) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export default function FooterTab({ settings, onChange, onSave, saving }: FooterTabProps) {
  return (
    <div className="swa-card">
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Footer Settings</h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <ImageUpload
          label="Footer Logo"
          value={settings.logo_url || ""}
          onChange={(url) => onChange({ ...settings, logo_url: url })}
          description="Upload footer logo or enter URL"
        />

        <div>
          <label className="swa-form-label">Brand Description</label>
          <textarea
            value={settings.brand_description || ""}
            onChange={(e) => onChange({ ...settings, brand_description: e.target.value })}
            className="swa-form-textarea"
            rows={3}
            placeholder="Australia's leading student wellbeing initiative..."
          />
        </div>

        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Contact Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="swa-form-label">Phone</label>
              <input
                type="text"
                value={settings.contact_phone || ""}
                onChange={(e) => onChange({ ...settings, contact_phone: e.target.value })}
                className="swa-form-input"
                placeholder="+61 02 555 505"
              />
            </div>
            <div>
              <label className="swa-form-label">Fax</label>
              <input
                type="text"
                value={settings.contact_fax || ""}
                onChange={(e) => onChange({ ...settings, contact_fax: e.target.value })}
                className="swa-form-input"
                placeholder="100 888 992"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="swa-form-label">Email</label>
              <input
                type="email"
                value={settings.contact_email || ""}
                onChange={(e) => onChange({ ...settings, contact_email: e.target.value })}
                className="swa-form-input"
                placeholder="events@nationalcheckinweek.com"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="swa-form-label">Copyright Text</label>
          <input
            type="text"
            value={settings.copyright_text || ""}
            onChange={(e) => onChange({ ...settings, copyright_text: e.target.value })}
            className="swa-form-input"
            placeholder="Copyright © 2026 National Check-In Week. All rights reserved."
          />
        </div>

        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Colors</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div>
              <label className="swa-form-label">Background Color</label>
              <input
                type="text"
                value={settings.background_color || ""}
                onChange={(e) => onChange({ ...settings, background_color: e.target.value })}
                className="swa-form-input"
                placeholder="#0B1D35"
              />
            </div>
            <div>
              <label className="swa-form-label">Text Color</label>
              <input
                type="text"
                value={settings.text_color || ""}
                onChange={(e) => onChange({ ...settings, text_color: e.target.value })}
                className="swa-form-input"
                placeholder="rgba(255,255,255,0.7)"
              />
            </div>
            <div>
              <label className="swa-form-label">Heading Color</label>
              <input
                type="text"
                value={settings.heading_color || ""}
                onChange={(e) => onChange({ ...settings, heading_color: e.target.value })}
                className="swa-form-input"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
          <button onClick={onSave} disabled={saving} className="swa-btn swa-btn--primary">
            {saving ? "Saving..." : "Save Footer Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
