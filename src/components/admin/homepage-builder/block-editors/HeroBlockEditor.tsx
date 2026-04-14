/**
 * Hero Block Editor Component
 * 
 * Provides editing interface for hero section content including:
 * - Main heading and subheading
 * - Primary and secondary CTA buttons
 * - Background image
 * - Badge with emoji and text
 * - Inline color customization
 * 
 * @component
 */

import React from "react";
import ImageUpload from "../../ImageUpload";
import type { HeroBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";

interface HeroBlockEditorProps {
  content: HeroBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const HeroBlockEditor: React.FC<HeroBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const useGlobalColors = colors.useGlobalColors !== false;

  const handleColorChange = (colorKey: string, value: string) => {
    onChange("colors", {
      ...colors,
      [colorKey]: value,
    });
  };

  const handleToggleGlobalColors = (checked: boolean) => {
    onChange("colors", {
      ...colors,
      useGlobalColors: checked,
    });
  };

  return (
    <>
      <TextInput
        label="Main Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="e.g., Student Wellbeing: A National Priority"
      />

      <TextArea
        label="Subheading"
        value={content.subheading || ""}
        onChange={(value) => onChange("subheading", value)}
        placeholder="Supporting text that expands on the heading"
        rows={3}
      />

      <TextInput
        label="Badge Emoji"
        value={content.badge?.emoji || ""}
        onChange={(value) => onChange("badge", { ...content.badge, emoji: value })}
        placeholder="📅"
        maxLength={2}
      />

      <TextInput
        label="Badge Text"
        value={content.badge?.text || ""}
        onChange={(value) => onChange("badge", { ...content.badge, text: value })}
        placeholder="25 May 2026 · Australia"
      />

      <TextInput
        label="Primary CTA Text"
        value={content.primaryCTA?.text || ""}
        onChange={(value) => onChange("primaryCTA", { ...content.primaryCTA, text: value })}
        placeholder="Register Now"
      />

      <TextInput
        label="Primary CTA Link"
        value={content.primaryCTA?.link || ""}
        onChange={(value) => onChange("primaryCTA", { ...content.primaryCTA, link: value })}
        placeholder="/events"
      />

      <TextInput
        label="Secondary CTA Text"
        value={content.secondaryCTA?.text || ""}
        onChange={(value) => onChange("secondaryCTA", { ...content.secondaryCTA, text: value })}
        placeholder="Learn More"
      />

      <TextInput
        label="Secondary CTA Link"
        value={content.secondaryCTA?.link || ""}
        onChange={(value) => onChange("secondaryCTA", { ...content.secondaryCTA, link: value })}
        placeholder="/about"
      />

      <ImageUpload
        label="Background Image"
        value={content.backgroundImage || ""}
        onChange={(url) => onChange("backgroundImage", url)}
        description="Hero section background image (recommended: 1920x1080px)"
      />

      {/* Color Customization Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>palette</span>
          Colors
        </h3>

        <div className="swa-form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useGlobalColors}
              onChange={(e) => handleToggleGlobalColors(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span>Use global colors (from Global Colors tab)</span>
          </label>
          {useGlobalColors && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>
              This block will use colors from the Global Colors tab. Uncheck to customize colors for this block only.
            </p>
          )}
        </div>

        {!useGlobalColors && (
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            <ColorPicker
              label="Heading Color"
              value={colors.heading || '#0f0e1a'}
              onChange={(value) => handleColorChange('heading', value)}
            />

            <ColorPicker
              label="Subheading Color"
              value={colors.subheading || '#4a4768'}
              onChange={(value) => handleColorChange('subheading', value)}
            />

            <ColorPicker
              label="Primary Button Background"
              value={colors.primaryButton || '#29B8E8'}
              onChange={(value) => handleColorChange('primaryButton', value)}
            />

            <ColorPicker
              label="Primary Button Text"
              value={colors.primaryButtonText || '#FFFFFF'}
              onChange={(value) => handleColorChange('primaryButtonText', value)}
            />

            <ColorPicker
              label="Secondary Button Background"
              value={colors.secondaryButton || '#FFFFFF'}
              onChange={(value) => handleColorChange('secondaryButton', value)}
            />

            <ColorPicker
              label="Secondary Button Text"
              value={colors.secondaryButtonText || '#FFFFFF'}
              onChange={(value) => handleColorChange('secondaryButtonText', value)}
            />
          </div>
        )}
      </div>
    </>
  );
};
