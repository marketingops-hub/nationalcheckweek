"use client";

import ImageUpload from "../ImageUpload";
import type { Logo } from "./types";

interface LogosTabProps {
  /** Array of logo objects to display */
  readonly logos: readonly Logo[];
  /** Callback to trigger add logo dialog */
  onAdd: () => Promise<void>;
  /** Callback to update a logo */
  onUpdate: (id: string, updates: Partial<Logo>) => Promise<void>;
  /** Callback to trigger delete confirmation */
  onDelete: (id: string, name: string) => void;
}

/**
 * LogosTab - Manage trusted organisation logos.
 * 
 * Displays a list of organisation logos with controls to:
 * - Add new logos
 * - Update logo images and links
 * - Toggle logo visibility
 * - Delete logos
 * 
 * @param props - Component props
 * @returns Logo management interface
 */
export default function LogosTab({ logos, onAdd, onUpdate, onDelete }: LogosTabProps) {
  return (
    <div className="swa-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Trusted Organisations</h2>
        <button onClick={onAdd} className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Add Logo
        </button>
      </div>

      {logos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-faint)" }}>
          No logos added yet. Click "Add Logo" to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {logos.map((logo) => (
            <div
              key={logo.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 12 }}>
                  <label className="swa-form-label">Organisation Name</label>
                  <input
                    type="text"
                    value={logo.name}
                    onChange={(e) => onUpdate(logo.id, { name: e.target.value })}
                    className="swa-form-input"
                    placeholder="Organisation name"
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="swa-form-label">Link URL (optional)</label>
                  <input
                    type="text"
                    value={logo.link_url || ""}
                    onChange={(e) => onUpdate(logo.id, { link_url: e.target.value })}
                    className="swa-form-input"
                    placeholder="https://example.com"
                  />
                </div>
                <ImageUpload
                  label="Logo Image"
                  value={logo.logo_url || ""}
                  onChange={(url) => onUpdate(logo.id, { logo_url: url })}
                  description="Upload logo or enter URL"
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={logo.is_active}
                    onChange={(e) => onUpdate(logo.id, { is_active: e.target.checked })}
                  />
                  Active
                </label>
                <button
                  onClick={() => onDelete(logo.id, logo.name)}
                  className="swa-icon-btn"
                  style={{ color: "#EF4444" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
