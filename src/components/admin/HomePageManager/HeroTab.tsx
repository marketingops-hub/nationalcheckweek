"use client";

import ColorPicker from "../ColorPicker";
import ImageUpload from "../ImageUpload";
import type { HeroSettings } from "./types";

interface HeroTabProps {
  /** Current hero section settings */
  readonly settings: Readonly<HeroSettings>;
  /** Callback when settings change */
  onChange: (settings: HeroSettings) => void;
  /** Callback to save settings */
  onSave: () => Promise<void>;
  /** Whether save operation is in progress */
  saving: boolean;
}

/**
 * HeroTab - Edit hero section settings including logo, headings, CTAs, and colors.
 * 
 * Provides form controls for:
 * - Logo image and height
 * - Event badge (emoji, date, location)
 * - Main heading (line 1, line 2, subheading)
 * - CTA buttons (primary and secondary)
 * - Hero background image
 * - Countdown timer settings
 * - Color scheme customization
 * 
 * @param props - Component props
 * @returns Hero section editing interface
 */
export default function HeroTab({ settings, onChange, onSave, saving }: HeroTabProps) {
  return (
    <div className="swa-card" data-testid="hero-tab">
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Hero Section Settings</h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Logo Settings */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Logo</h3>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <ImageUpload
              label="Logo URL"
              value={settings.logo_url || ""}
              onChange={(url) => onChange({ ...settings, logo_url: url })}
              description="Upload or enter logo URL"
            />
            <div>
              <label className="swa-form-label">Logo Height (px)</label>
              <input
                type="number"
                value={settings.logo_height || 44}
                onChange={(e) => {
                  const height = parseInt(e.target.value, 10);
                  if (!isNaN(height) && height > 0) {
                    onChange({ ...settings, logo_height: height });
                  }
                }}
                min="1"
                max="200"
                className="swa-form-input"
                aria-label="Logo height in pixels"
                data-testid="logo-height-input"
              />
            </div>
          </div>
        </div>

        {/* Event Badge */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Event Badge</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label className="swa-form-label">Emoji</label>
              <input
                type="text"
                value={settings.event_emoji || ""}
                onChange={(e) => onChange({ ...settings, event_emoji: e.target.value })}
                className="swa-form-input"
                placeholder="📅"
              />
            </div>
            <div>
              <label className="swa-form-label">Event Date</label>
              <input
                type="text"
                value={settings.event_date || ""}
                onChange={(e) => onChange({ ...settings, event_date: e.target.value })}
                className="swa-form-input"
                placeholder="25 May 2026"
              />
            </div>
            <div>
              <label className="swa-form-label">Location</label>
              <input
                type="text"
                value={settings.event_location || ""}
                onChange={(e) => onChange({ ...settings, event_location: e.target.value })}
                className="swa-form-input"
                placeholder="Australia"
              />
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Main Heading</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="swa-form-label">Heading Line 1</label>
              <input
                type="text"
                value={settings.heading_line1 || ""}
                onChange={(e) => onChange({ ...settings, heading_line1: e.target.value })}
                className="swa-form-input"
                placeholder="Student Wellbeing:"
              />
            </div>
            <div>
              <label className="swa-form-label">Heading Line 2</label>
              <input
                type="text"
                value={settings.heading_line2 || ""}
                onChange={(e) => onChange({ ...settings, heading_line2: e.target.value })}
                className="swa-form-input"
                placeholder="A National Priority."
              />
            </div>
            <div>
              <label className="swa-form-label">Subheading</label>
              <textarea
                value={settings.subheading || ""}
                onChange={(e) => onChange({ ...settings, subheading: e.target.value })}
                className="swa-form-textarea"
                rows={3}
                placeholder="Join Australia's leading student wellbeing event..."
              />
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Call-to-Action Buttons</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="swa-form-label">Primary Button Text</label>
              <input
                type="text"
                value={settings.primary_cta_text || ""}
                onChange={(e) => onChange({ ...settings, primary_cta_text: e.target.value })}
                className="swa-form-input"
                placeholder="Register Now"
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
                placeholder="Learn More"
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
        </div>

        {/* Hero Image */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Hero Image</h3>
          <ImageUpload
            label="Hero Background Image"
            value={settings.hero_image_url || ""}
            onChange={(url) => onChange({ ...settings, hero_image_url: url })}
            description="Recommended: 1920x1080px or larger"
          />
        </div>

        {/* Countdown */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Countdown Timer</h3>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div>
              <label className="swa-form-label">Target Date (ISO 8601)</label>
              <input
                type="text"
                value={settings.countdown_target_date || ""}
                onChange={(e) => onChange({ ...settings, countdown_target_date: e.target.value })}
                className="swa-form-input"
                placeholder="2026-05-25T00:00:00+10:00"
              />
            </div>
            <div>
              <label className="swa-form-label">Show Countdown</label>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={settings.show_countdown || false}
                    onChange={(e) => onChange({ ...settings, show_countdown: e.target.checked })}
                  />
                  <span style={{ fontSize: 14 }}>Display countdown timer</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Colors & Styling</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <ColorPicker
              label="Background Color"
              value={settings.background_color || "#FFFFFF"}
              onChange={(color) => onChange({ ...settings, background_color: color })}
              description="Hero section background"
            />
            <ColorPicker
              label="Heading Color"
              value={settings.heading_color || "#0B1D35"}
              onChange={(color) => onChange({ ...settings, heading_color: color })}
              description="Main heading text color"
            />
            <ColorPicker
              label="Subheading Color"
              value={settings.subheading_color || "#475569"}
              onChange={(color) => onChange({ ...settings, subheading_color: color })}
              description="Subheading text color"
            />
            <ColorPicker
              label="Primary Button Background"
              value={settings.primary_button_bg || "#29B8E8"}
              onChange={(color) => onChange({ ...settings, primary_button_bg: color })}
              description="Primary CTA button color"
            />
            <ColorPicker
              label="Primary Button Text"
              value={settings.primary_button_text || "#FFFFFF"}
              onChange={(color) => onChange({ ...settings, primary_button_text: color })}
              description="Primary button text color"
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
          <button 
            onClick={onSave} 
            disabled={saving} 
            className="swa-btn swa-btn--primary"
            aria-busy={saving}
            data-testid="save-hero-button"
          >
            {saving ? "Saving..." : "Save Hero Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
