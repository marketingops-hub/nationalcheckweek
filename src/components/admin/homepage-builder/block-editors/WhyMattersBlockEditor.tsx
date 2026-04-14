/**
 * Why Matters Block Editor Component
 */

import React from "react";
import type { WhyMattersBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface WhyMattersBlockEditorProps {
  content: WhyMattersBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const WhyMattersBlockEditor: React.FC<WhyMattersBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);

  const handleCardChange = (index: number, field: string, value: string) => {
    const updatedCards = [...(content.cards || [])];
    updatedCards[index] = {
      ...updatedCards[index],
      [field]: value,
    };
    onChange("cards", updatedCards);
  };

  const addCard = () => {
    const newCard = { icon: "", title: "", description: "" };
    onChange("cards", [...(content.cards || []), newCard]);
  };

  const removeCard = (index: number) => {
    const updatedCards = content.cards.filter((_, i) => i !== index);
    onChange("cards", updatedCards);
  };

  return (
    <>
      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="Why This Matters"
      />

      <TextArea
        label="Subheading"
        value={content.subheading || ""}
        onChange={(value) => onChange("subheading", value)}
        placeholder="Supporting text..."
        rows={2}
      />

      <div className="swa-form-group">
        <label className="swa-label">Cards</label>
        {content.cards?.map((card, index) => (
          <div key={index} style={{ 
            border: "1px solid #e4e2ec", 
            borderRadius: "8px", 
            padding: "16px", 
            marginBottom: "16px",
            background: "#f8f9fa"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <strong>Card {index + 1}</strong>
              <button
                type="button"
                onClick={() => removeCard(index)}
                className="swa-btn-secondary"
                style={{ padding: "4px 12px", fontSize: "0.875rem" }}
              >
                Remove
              </button>
            </div>

            <div className="swa-form-group">
              <label className="swa-label">Icon (Material Symbol)</label>
              <input
                type="text"
                value={card.icon || ""}
                onChange={(e) => handleCardChange(index, "icon", e.target.value)}
                className="swa-input"
                placeholder="trending_up"
              />
              <small style={{ color: "#7b78a0", fontSize: "0.875rem" }}>
                Browse icons at <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer">Google Material Symbols</a>
              </small>
            </div>

            <div className="swa-form-group">
              <label className="swa-label">Title</label>
              <input
                type="text"
                value={card.title || ""}
                onChange={(e) => handleCardChange(index, "title", e.target.value)}
                className="swa-input"
                placeholder="Card title..."
              />
            </div>

            <div className="swa-form-group">
              <label className="swa-label">Description</label>
              <textarea
                value={card.description || ""}
                onChange={(e) => handleCardChange(index, "description", e.target.value)}
                className="swa-input"
                rows={3}
                placeholder="Card description..."
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addCard}
          className="swa-btn-secondary"
          style={{ width: "100%" }}
        >
          + Add Card
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
            label="Accent Color (icons)"
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
