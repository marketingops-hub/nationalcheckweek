/**
 * Welcome Block Editor Component
 */

import React from "react";
import type { WelcomeBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface WelcomeBlockEditorProps {
  content: WelcomeBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const WelcomeBlockEditor: React.FC<WelcomeBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);

  return (
    <>
      <TextInput
        label="Eyebrow Text"
        value={content.eyebrow || ""}
        onChange={(value) => onChange("eyebrow", value)}
        placeholder="The Data. The Issues. The Experts."
      />

      <TextArea
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="Main heading..."
        rows={2}
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(value) => onChange("description", value)}
        placeholder="Short description..."
        rows={3}
      />

      <TextArea
        label="Long Description"
        value={content.longDescription || ""}
        onChange={(value) => onChange("longDescription", value)}
        placeholder="Detailed description..."
        rows={4}
      />

      {/* Color Customization Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>palette</span>
          Colors
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
          <ColorPicker
            label="Accent Color (eyebrow text)"
            value={colors.accentColor || '#29B8E8'}
            onChange={(value) => handleColorChange('accentColor', value)}
          />

          <ColorPicker
            label="Heading Color"
            value={colors.heading || '#0f0e1a'}
            onChange={(value) => handleColorChange('heading', value)}
          />

          <ColorPicker
            label="Text Color"
            value={colors.textColor || '#4a4768'}
            onChange={(value) => handleColorChange('textColor', value)}
          />
        </div>
      </div>
    </>
  );
};
