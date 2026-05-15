/**
 * What Is It Block Editor Component
 */

import React from "react";
import type { WhatIsItBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface WhatIsItBlockEditorProps {
  content: WhatIsItBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const WhatIsItBlockEditor: React.FC<WhatIsItBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);

  return (
    <>
      <TextInput
        label="Vimeo URL"
        value={content.vimeoUrl || ""}
        onChange={(value) => onChange("vimeoUrl", value)}
        placeholder="https://player.vimeo.com/video/YOUR_VIDEO_ID"
        type="url"
      />

      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="What is National Check-In Week?"
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(value) => onChange("description", value)}
        placeholder="Description text..."
        rows={5}
      />

      <TextInput
        label="CTA Button Text"
        value={content.ctaText || ""}
        onChange={(value) => onChange("ctaText", value)}
        placeholder="Register for upcoming events here!"
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
            label="Accent Color"
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
        </div>
      </div>
    </>
  );
};
