/**
 * Be Part CTA Block Editor Component
 */

import React from "react";
import type { BePartCTABlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface BePartCTABlockEditorProps {
  content: BePartCTABlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const BePartCTABlockEditor: React.FC<BePartCTABlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);
  return (
    <>
      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="Be Part of the National Conversation"
      />

      <TextInput
        label="Subheading"
        value={content.subheading || ""}
        onChange={(value) => onChange("subheading", value)}
        placeholder="The issues are here. The data is emerging..."
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(value) => onChange("description", value)}
        placeholder="Description text..."
        rows={3}
      />

      <TextInput
        label="CTA Button Text"
        value={content.ctaText || ""}
        onChange={(value) => onChange("ctaText", value)}
        placeholder="View Events"
      />

      <TextInput
        label="CTA Button Link"
        value={content.ctaLink || ""}
        onChange={(value) => onChange("ctaLink", value)}
        placeholder="/events"
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
            value={colors.backgroundColor || '#29B8E8'}
            onChange={(value) => handleColorChange('backgroundColor', value)}
          />

          <ColorPicker
            label="Text Color"
            value={colors.textColor || '#FFFFFF'}
            onChange={(value) => handleColorChange('textColor', value)}
          />

          <ColorPicker
            label="Primary Button Background"
            value={colors.primaryButton || '#FFFFFF'}
            onChange={(value) => handleColorChange('primaryButton', value)}
          />

          <ColorPicker
            label="Primary Button Text"
            value={colors.primaryButtonText || '#29B8E8'}
            onChange={(value) => handleColorChange('primaryButtonText', value)}
          />
        </div>
      </div>
    </>
  );
};
