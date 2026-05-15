"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { DEFAULT_FONTS, FONT_WEIGHTS, type TypographySettings } from "@/lib/typography";
import FontManager from "./FontManager";

export default function TypographyEditor() {
  const [settings, setSettings] = useState<TypographySettings | null>(null);
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchCustomFonts();
  }, []);

  async function fetchSettings() {
    try {
      const res = await adminFetch("/api/admin/typography");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomFonts() {
    try {
      const res = await adminFetch("/api/admin/typography/fonts");
      const data = await res.json();
      setCustomFonts(data.fonts.map((f: { font_name: string }) => f.font_name));
    } catch (err) {
      console.error("Failed to fetch custom fonts:", err);
    }
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await adminFetch("/api/admin/typography", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess("Typography settings saved successfully! Refresh the page to see changes.");
      
      // Reload the page after 2 seconds to apply new typography
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("Reset all typography settings to defaults? This cannot be undone.")) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const defaults: Partial<TypographySettings> = {
        h1_font_family: "Montserrat",
        h1_font_size: "clamp(2.4rem, 5vw, 3.75rem)",
        h1_font_weight: "900",
        h1_line_height: "1.1",
        h2_font_family: "Montserrat",
        h2_font_size: "clamp(1.75rem, 3vw, 2.5rem)",
        h2_font_weight: "800",
        h2_line_height: "1.2",
        h3_font_family: "Montserrat",
        h3_font_size: "1.3rem",
        h3_font_weight: "700",
        h3_line_height: "1.3",
        body_font_family: "Poppins",
        body_font_size: "16px",
        body_font_weight: "400",
        body_line_height: "1.7",
        nav_font_family: "Poppins",
        nav_font_size: "14px",
        nav_font_weight: "600",
        footer_font_family: "Poppins",
        footer_font_size: "14px",
        footer_font_weight: "400",
        subtitle_font_family: "Poppins",
        subtitle_font_size: "1.1rem",
        subtitle_font_weight: "400",
        subtitle_line_height: "1.6",
      };

      const res = await adminFetch("/api/admin/typography", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults),
      });

      if (!res.ok) {
        throw new Error("Failed to reset settings");
      }

      setSuccess("Settings reset to defaults! Refreshing...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset settings");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: keyof TypographySettings, value: string) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  const allFonts = [...DEFAULT_FONTS, ...customFonts];

  if (loading) {
    return <div className="swa-card">Loading typography settings...</div>;
  }

  if (!settings) {
    return <div className="swa-card">Failed to load typography settings.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Alerts */}
      {error && (
        <div className="swa-alert swa-alert--error">{error}</div>
      )}
      {success && (
        <div className="swa-alert swa-alert--success">{success}</div>
      )}

      {/* Font Manager */}
      <FontManager onFontUploaded={fetchCustomFonts} />

      {/* Typography Settings Form */}
      <div className="swa-card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          Typography Settings
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* H1 Settings */}
          <TypographySection
            title="H1 Heading"
            fontFamily={settings.h1_font_family}
            fontSize={settings.h1_font_size}
            fontWeight={settings.h1_font_weight}
            lineHeight={settings.h1_line_height}
            onFontFamilyChange={(v) => updateSetting("h1_font_family", v)}
            onFontSizeChange={(v) => updateSetting("h1_font_size", v)}
            onFontWeightChange={(v) => updateSetting("h1_font_weight", v)}
            onLineHeightChange={(v) => updateSetting("h1_line_height", v)}
            availableFonts={allFonts}
          />

          {/* H2 Settings */}
          <TypographySection
            title="H2 Heading"
            fontFamily={settings.h2_font_family}
            fontSize={settings.h2_font_size}
            fontWeight={settings.h2_font_weight}
            lineHeight={settings.h2_line_height}
            onFontFamilyChange={(v) => updateSetting("h2_font_family", v)}
            onFontSizeChange={(v) => updateSetting("h2_font_size", v)}
            onFontWeightChange={(v) => updateSetting("h2_font_weight", v)}
            onLineHeightChange={(v) => updateSetting("h2_line_height", v)}
            availableFonts={allFonts}
          />

          {/* H3 Settings */}
          <TypographySection
            title="H3 Heading"
            fontFamily={settings.h3_font_family}
            fontSize={settings.h3_font_size}
            fontWeight={settings.h3_font_weight}
            lineHeight={settings.h3_line_height}
            onFontFamilyChange={(v) => updateSetting("h3_font_family", v)}
            onFontSizeChange={(v) => updateSetting("h3_font_size", v)}
            onFontWeightChange={(v) => updateSetting("h3_font_weight", v)}
            onLineHeightChange={(v) => updateSetting("h3_line_height", v)}
            availableFonts={allFonts}
          />

          {/* Body Text Settings */}
          <TypographySection
            title="Body Text"
            fontFamily={settings.body_font_family}
            fontSize={settings.body_font_size}
            fontWeight={settings.body_font_weight}
            lineHeight={settings.body_line_height}
            onFontFamilyChange={(v) => updateSetting("body_font_family", v)}
            onFontSizeChange={(v) => updateSetting("body_font_size", v)}
            onFontWeightChange={(v) => updateSetting("body_font_weight", v)}
            onLineHeightChange={(v) => updateSetting("body_line_height", v)}
            availableFonts={allFonts}
          />

          {/* Navigation Settings */}
          <TypographySection
            title="Navigation"
            fontFamily={settings.nav_font_family}
            fontSize={settings.nav_font_size}
            fontWeight={settings.nav_font_weight}
            onFontFamilyChange={(v) => updateSetting("nav_font_family", v)}
            onFontSizeChange={(v) => updateSetting("nav_font_size", v)}
            onFontWeightChange={(v) => updateSetting("nav_font_weight", v)}
            availableFonts={allFonts}
            hideLineHeight
          />

          {/* Footer Settings */}
          <TypographySection
            title="Footer"
            fontFamily={settings.footer_font_family}
            fontSize={settings.footer_font_size}
            fontWeight={settings.footer_font_weight}
            onFontFamilyChange={(v) => updateSetting("footer_font_family", v)}
            onFontSizeChange={(v) => updateSetting("footer_font_size", v)}
            onFontWeightChange={(v) => updateSetting("footer_font_weight", v)}
            availableFonts={allFonts}
            hideLineHeight
          />

          {/* Subtitle Settings */}
          <TypographySection
            title="Subtitle / Lead Text"
            fontFamily={settings.subtitle_font_family}
            fontSize={settings.subtitle_font_size}
            fontWeight={settings.subtitle_font_weight}
            lineHeight={settings.subtitle_line_height}
            onFontFamilyChange={(v) => updateSetting("subtitle_font_family", v)}
            onFontSizeChange={(v) => updateSetting("subtitle_font_size", v)}
            onFontWeightChange={(v) => updateSetting("subtitle_font_weight", v)}
            onLineHeightChange={(v) => updateSetting("subtitle_line_height", v)}
            availableFonts={allFonts}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="swa-btn swa-btn--primary"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="swa-btn swa-btn--secondary"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

interface TypographySectionProps {
  title: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight?: string;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: string) => void;
  onFontWeightChange: (value: string) => void;
  onLineHeightChange?: (value: string) => void;
  availableFonts: readonly string[];
  hideLineHeight?: boolean;
}

function TypographySection({
  title,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  onFontFamilyChange,
  onFontSizeChange,
  onFontWeightChange,
  onLineHeightChange,
  availableFonts,
  hideLineHeight,
}: TypographySectionProps) {
  return (
    <div style={{ paddingBottom: 24, borderBottom: "1px solid var(--color-border-faint)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "var(--color-text-primary)" }}>
        {title}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div>
          <label className="swa-form-label">Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="swa-form-input"
          >
            {availableFonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="swa-form-label">Font Size</label>
          <input
            type="text"
            value={fontSize}
            onChange={(e) => onFontSizeChange(e.target.value)}
            className="swa-form-input"
            placeholder="e.g., 16px, 1rem, clamp(...)"
          />
        </div>
        <div>
          <label className="swa-form-label">Font Weight</label>
          <select
            value={fontWeight}
            onChange={(e) => onFontWeightChange(e.target.value)}
            className="swa-form-input"
          >
            {FONT_WEIGHTS.map((weight) => (
              <option key={weight} value={weight}>
                {weight}
              </option>
            ))}
          </select>
        </div>
        {!hideLineHeight && lineHeight && onLineHeightChange && (
          <div>
            <label className="swa-form-label">Line Height</label>
            <input
              type="text"
              value={lineHeight}
              onChange={(e) => onLineHeightChange(e.target.value)}
              className="swa-form-input"
              placeholder="e.g., 1.5, 24px"
            />
          </div>
        )}
      </div>
    </div>
  );
}
