/**
 * What And Who Block Editor Component
 */

import React from "react";
import type { WhatAndWhoBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface WhatAndWhoBlockEditorProps {
  content: WhatAndWhoBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const WhatAndWhoBlockEditor: React.FC<WhatAndWhoBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);
  const handleTagChange = (index: number, value: string) => {
    const updatedTags = [...(content.column1Tags || [])];
    updatedTags[index] = value;
    onChange("column1Tags", updatedTags);
  };

  const addTag = () => {
    onChange("column1Tags", [...(content.column1Tags || []), ""]);
  };

  const removeTag = (index: number) => {
    const updatedTags = content.column1Tags.filter((_, i) => i !== index);
    onChange("column1Tags", updatedTags);
  };

  const handleItemChange = (index: number, value: string) => {
    const updatedItems = [...(content.column2Items || [])];
    updatedItems[index] = value;
    onChange("column2Items", updatedItems);
  };

  const addItem = () => {
    onChange("column2Items", [...(content.column2Items || []), ""]);
  };

  const removeItem = (index: number) => {
    const updatedItems = content.column2Items.filter((_, i) => i !== index);
    onChange("column2Items", updatedItems);
  };

  return (
    <>
      <TextInput
        label="Column 1 Heading"
        value={content.column1Heading || ""}
        onChange={(value) => onChange("column1Heading", value)}
        placeholder="Who You'll Hear From"
      />

      <TextArea
        label="Column 1 Description"
        value={content.column1Description || ""}
        onChange={(value) => onChange("column1Description", value)}
        placeholder="Description text..."
        rows={3}
      />

      <div className="swa-form-group">
        <label className="swa-label">Column 1 Tags</label>
        {content.column1Tags?.map((tag, index) => (
          <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              value={tag || ""}
              onChange={(e) => handleTagChange(index, e.target.value)}
              className="swa-input"
              placeholder="Tag name..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="swa-btn-secondary"
              style={{ padding: "8px 16px" }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addTag}
          className="swa-btn-secondary"
          style={{ width: "100%" }}
        >
          + Add Tag
        </button>
      </div>

      <TextInput
        label="Column 2 Heading"
        value={content.column2Heading || ""}
        onChange={(value) => onChange("column2Heading", value)}
        placeholder="What You'll Access"
      />

      <div className="swa-form-group">
        <label className="swa-label">Column 2 Items</label>
        {content.column2Items?.map((item, index) => (
          <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              value={item || ""}
              onChange={(e) => handleItemChange(index, e.target.value)}
              className="swa-input"
              placeholder="Item text..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="swa-btn-secondary"
              style={{ padding: "8px 16px" }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="swa-btn-secondary"
          style={{ width: "100%" }}
        >
          + Add Item
        </button>
      </div>

      <TextArea
        label="CTA Quote"
        value={content.ctaQuote || ""}
        onChange={(value) => onChange("ctaQuote", value)}
        placeholder="Quote text (use \n for line breaks)..."
        rows={3}
      />

      {/* Color Customization Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>palette</span>
          Colors
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
          <ColorPicker
            label="Accent Color (tags & icons)"
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
