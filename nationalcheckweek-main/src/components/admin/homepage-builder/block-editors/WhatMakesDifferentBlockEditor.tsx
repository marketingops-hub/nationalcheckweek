/**
 * What Makes Different Block Editor Component
 */

import React from "react";
import type { WhatMakesDifferentBlockContent } from "@/types/homepage-blocks";
import { TextInput, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface WhatMakesDifferentBlockEditorProps {
  content: WhatMakesDifferentBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const WhatMakesDifferentBlockEditor: React.FC<WhatMakesDifferentBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);
  const handleParagraphChange = (index: number, value: string) => {
    const updatedParagraphs = [...(content.paragraphs || [])];
    updatedParagraphs[index] = value;
    onChange("paragraphs", updatedParagraphs);
  };

  const addParagraph = () => {
    onChange("paragraphs", [...(content.paragraphs || []), ""]);
  };

  const removeParagraph = (index: number) => {
    const updatedParagraphs = content.paragraphs.filter((_, i) => i !== index);
    onChange("paragraphs", updatedParagraphs);
  };

  return (
    <>
      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="What Makes NCIW Different"
      />

      <div className="swa-form-group">
        <label className="swa-label">Paragraphs</label>
        {content.paragraphs?.map((paragraph, index) => (
          <div key={index} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong>Paragraph {index + 1}</strong>
              {content.paragraphs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParagraph(index)}
                  className="swa-btn-secondary"
                  style={{ padding: "4px 12px", fontSize: "0.875rem" }}
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              value={paragraph || ""}
              onChange={(e) => handleParagraphChange(index, e.target.value)}
              className="swa-input"
              rows={3}
              placeholder="Enter paragraph text..."
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addParagraph}
          className="swa-btn-secondary"
          style={{ width: "100%", marginTop: "8px" }}
        >
          + Add Paragraph
        </button>
      </div>

      {/* Color Customization Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>palette</span>
          Colors
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
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
