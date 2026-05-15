/**
 * Your Voice Block Editor Component
 * Editable fields for the Your Voice CTA block
 */

import React from "react";
import type { YourVoiceBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface YourVoiceBlockEditorProps {
  content: YourVoiceBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const YourVoiceBlockEditor: React.FC<YourVoiceBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);

  return (
    <>
      <TextInput
        label="Eyebrow Text"
        value={content.eyebrow || ""}
        onChange={(value) => onChange("eyebrow", value)}
        placeholder="We Need Your Help"
      />

      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="Let Your Voice Be Heard"
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(value) => onChange("description", value)}
        placeholder="At National Check Week, we need your opinion to help us find the best solution..."
        rows={4}
      />

      <TextInput
        label="CTA Button Text"
        value={content.ctaText || ""}
        onChange={(value) => onChange("ctaText", value)}
        placeholder="Join the Conversation"
      />

      <TextInput
        label="CTA Button Link"
        value={content.ctaLink || ""}
        onChange={(value) => onChange("ctaLink", value)}
        placeholder="/your-voice"
      />

      {/* Color Customization Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>palette</span>
          Colors
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
          <ColorPicker
            label="Accent Color (Eyebrow)"
            value={colors.accentColor || '#29B8E8'}
            onChange={(value) => handleColorChange('accentColor', value)}
          />

          <ColorPicker
            label="Background Color"
            value={colors.backgroundColor || '#0B1D35'}
            onChange={(value) => handleColorChange('backgroundColor', value)}
          />

          <ColorPicker
            label="Text Color"
            value={colors.textColor || '#FFFFFF'}
            onChange={(value) => handleColorChange('textColor', value)}
          />

          <ColorPicker
            label="Button Background"
            value={colors.primaryButton || '#29B8E8'}
            onChange={(value) => handleColorChange('primaryButton', value)}
          />

          <ColorPicker
            label="Button Text Color"
            value={colors.primaryButtonText || '#FFFFFF'}
            onChange={(value) => handleColorChange('primaryButtonText', value)}
          />
        </div>
      </div>
    </>
  );
};
