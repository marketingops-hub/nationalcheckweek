/**
 * CTA Block Editor Component
 * 
 * Provides editing interface for call-to-action sections including:
 * - Eyebrow text, heading, and description
 * - Primary and secondary CTA buttons
 * - Background and text colors
 * 
 * @component
 */

import React from "react";
import type { CTABlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface CTABlockEditorProps {
  content: CTABlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const CTABlockEditor: React.FC<CTABlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);
  return (
    <>
      <TextInput
        label="Eyebrow Text"
        value={content.eyebrow || ""}
        onChange={(value) => onChange("eyebrow", value)}
        placeholder="Join the Movement"
      />

      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="Ready to Make Student Wellbeing a Priority?"
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(value) => onChange("description", value)}
        placeholder="Supporting text that encourages action"
        rows={3}
      />

      <TextInput
        label="Primary CTA Text"
        value={content.primaryCTA?.text || ""}
        onChange={(value) => onChange("primaryCTA", { ...content.primaryCTA, text: value })}
        placeholder="Register Your School"
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
        placeholder="Download Resources"
      />

      <TextInput
        label="Secondary CTA Link"
        value={content.secondaryCTA?.link || ""}
        onChange={(value) => onChange("secondaryCTA", { ...content.secondaryCTA, link: value })}
        placeholder="/resources"
      />

      {/* Color Customization Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>palette</span>
          Colors
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
          <ColorPicker
            label="Background Color"
            value={colors.ctaBackground || '#0B1D35'}
            onChange={(value) => handleColorChange('ctaBackground', value)}
          />

          <ColorPicker
            label="Text Color"
            value={colors.ctaText || '#FFFFFF'}
            onChange={(value) => handleColorChange('ctaText', value)}
          />

          <ColorPicker
            label="Primary Button Background"
            value={colors.ctaPrimaryButton || '#29B8E8'}
            onChange={(value) => handleColorChange('ctaPrimaryButton', value)}
          />

          <ColorPicker
            label="Primary Button Text"
            value={colors.primaryButtonText || '#FFFFFF'}
            onChange={(value) => handleColorChange('primaryButtonText', value)}
          />
        </div>
      </div>
    </>
  );
};
