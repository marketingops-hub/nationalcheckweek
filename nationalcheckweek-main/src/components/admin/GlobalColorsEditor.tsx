"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import ColorPicker from "./ColorPicker";

interface GlobalColors {
  primaryButton: string;
  primaryButtonText: string;
  secondaryButton: string;
  secondaryButtonText: string;
  heading: string;
  subheading: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  ctaBackground: string;
  ctaText: string;
  ctaPrimaryButton: string;
  borderColor: string;
  mutedText: string;
}

export default function GlobalColorsEditor() {
  const [colors, setColors] = useState<GlobalColors>({
    primaryButton: "#29B8E8",
    primaryButtonText: "#FFFFFF",
    secondaryButton: "rgba(255,255,255,0.2)",
    secondaryButtonText: "#FFFFFF",
    heading: "#0f0e1a",
    subheading: "#4a4768",
    accentColor: "#29B8E8",
    backgroundColor: "#FFFFFF",
    textColor: "#1e1b33",
    ctaBackground: "#0B1D35",
    ctaText: "#FFFFFF",
    ctaPrimaryButton: "#29B8E8",
    borderColor: "#e4e2ec",
    mutedText: "#7b78a0",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchGlobalColors();
  }, []);

  async function fetchGlobalColors() {
    try {
      const res = await adminFetch("/api/admin/homepage-global-settings");
      const data = await res.json();
      if (data.settings) {
        setColors(data.settings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load colors");
    } finally {
      setLoading(false);
    }
  }

  async function saveColors() {
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await adminFetch("/api/admin/homepage-global-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: colors }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSuccess("Global colors saved successfully! Refresh the homepage to see changes.");
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save colors");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    if (!confirm("Reset all colors to default values?")) return;
    
    setColors({
      primaryButton: "#29B8E8",
      primaryButtonText: "#FFFFFF",
      secondaryButton: "rgba(255,255,255,0.2)",
      secondaryButtonText: "#FFFFFF",
      heading: "#0f0e1a",
      subheading: "#4a4768",
      accentColor: "#29B8E8",
      backgroundColor: "#FFFFFF",
      textColor: "#1e1b33",
      ctaBackground: "#0B1D35",
      ctaText: "#FFFFFF",
      ctaPrimaryButton: "#29B8E8",
      borderColor: "#e4e2ec",
      mutedText: "#7b78a0",
    });
  }

  if (loading) {
    return <div className="swa-card">Loading global colors...</div>;
  }

  return (
    <div className="swa-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Global Color Settings</h2>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            These colors apply to all homepage blocks by default. Individual blocks can override these settings.
          </p>
        </div>
        <button 
          onClick={resetToDefaults}
          className="swa-btn"
          style={{ fontSize: 13 }}
        >
          Reset to Defaults
        </button>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="swa-alert swa-alert--success" style={{ marginBottom: 16 }}>{success}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Primary Colors */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--color-primary)" }}>
              palette
            </span>
            Primary Colors
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <ColorPicker
              label="Primary Button"
              value={colors.primaryButton}
              onChange={(color) => setColors({ ...colors, primaryButton: color })}
              description="Main CTA buttons, icons, accents"
            />
            <ColorPicker
              label="Primary Button Text"
              value={colors.primaryButtonText}
              onChange={(color) => setColors({ ...colors, primaryButtonText: color })}
              description="Text color on primary buttons"
            />
            <ColorPicker
              label="Accent Color"
              value={colors.accentColor}
              onChange={(color) => setColors({ ...colors, accentColor: color })}
              description="Stats, highlights, badges"
            />
          </div>
        </div>

        {/* Secondary Colors */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--color-primary)" }}>
              brush
            </span>
            Secondary Colors
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <ColorPicker
              label="Secondary Button"
              value={colors.secondaryButton}
              onChange={(color) => setColors({ ...colors, secondaryButton: color })}
              description="Secondary CTA buttons"
            />
            <ColorPicker
              label="Secondary Button Text"
              value={colors.secondaryButtonText}
              onChange={(color) => setColors({ ...colors, secondaryButtonText: color })}
              description="Text on secondary buttons"
            />
          </div>
        </div>

        {/* Typography Colors */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--color-primary)" }}>
              text_fields
            </span>
            Typography
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <ColorPicker
              label="Heading Color"
              value={colors.heading}
              onChange={(color) => setColors({ ...colors, heading: color })}
              description="Main headings (H1, H2)"
            />
            <ColorPicker
              label="Subheading Color"
              value={colors.subheading}
              onChange={(color) => setColors({ ...colors, subheading: color })}
              description="Subheadings, descriptions"
            />
            <ColorPicker
              label="Text Color"
              value={colors.textColor}
              onChange={(color) => setColors({ ...colors, textColor: color })}
              description="Body text, paragraphs"
            />
            <ColorPicker
              label="Muted Text"
              value={colors.mutedText}
              onChange={(color) => setColors({ ...colors, mutedText: color })}
              description="Secondary text, labels"
            />
          </div>
        </div>

        {/* Background Colors */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--color-primary)" }}>
              format_color_fill
            </span>
            Backgrounds
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <ColorPicker
              label="Background Color"
              value={colors.backgroundColor}
              onChange={(color) => setColors({ ...colors, backgroundColor: color })}
              description="Main background"
            />
            <ColorPicker
              label="Border Color"
              value={colors.borderColor}
              onChange={(color) => setColors({ ...colors, borderColor: color })}
              description="Borders, dividers"
            />
          </div>
        </div>

        {/* CTA Section Colors */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--color-primary)" }}>
              campaign
            </span>
            CTA Section
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <ColorPicker
              label="CTA Background"
              value={colors.ctaBackground}
              onChange={(color) => setColors({ ...colors, ctaBackground: color })}
              description="CTA banner background"
            />
            <ColorPicker
              label="CTA Text"
              value={colors.ctaText}
              onChange={(color) => setColors({ ...colors, ctaText: color })}
              description="Text on CTA banner"
            />
            <ColorPicker
              label="CTA Primary Button"
              value={colors.ctaPrimaryButton}
              onChange={(color) => setColors({ ...colors, ctaPrimaryButton: color })}
              description="CTA button color"
            />
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: "flex", gap: 12, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
          <button 
            onClick={saveColors} 
            disabled={saving} 
            className="swa-btn swa-btn--primary"
          >
            {saving ? "Saving..." : "Save Global Colors"}
          </button>
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="swa-btn"
            style={{ textDecoration: "none" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            Preview Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
