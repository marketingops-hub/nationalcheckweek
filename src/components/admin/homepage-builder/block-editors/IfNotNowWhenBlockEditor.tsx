/**
 * If Not Now When Block Editor Component
 */

import React from "react";
import type { IfNotNowWhenBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";

interface Props {
  content: IfNotNowWhenBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const IfNotNowWhenBlockEditor: React.FC<Props> = ({ content, onChange }) => {
  const handleItemChange = (index: number, value: string) => {
    const updated = [...(content.checklistItems || [])];
    updated[index] = value;
    onChange("checklistItems", updated);
  };

  const addItem = () => onChange("checklistItems", [...(content.checklistItems || []), ""]);

  const removeItem = (index: number) =>
    onChange("checklistItems", content.checklistItems.filter((_, i) => i !== index));

  return (
    <>
      <TextInput
        label="Section Title"
        value={content.sectionTitle || ""}
        onChange={(v) => onChange("sectionTitle", v)}
        placeholder="If not now, when?"
      />

      <TextInput
        label="Main Heading"
        value={content.heading || ""}
        onChange={(v) => onChange("heading", v)}
        placeholder="Unite for a New Era in Student Wellbeing"
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(v) => onChange("description", v)}
        rows={4}
        placeholder="Australia is at a critical crossroads..."
      />

      <TextArea
        label="Bold Note (optional)"
        value={content.boldNote || ""}
        onChange={(v) => onChange("boldNote", v)}
        rows={2}
        placeholder="All events, tools and resources are free for every school and family."
      />

      <TextInput
        label="Sub Heading"
        value={content.subheading || ""}
        onChange={(v) => onChange("subheading", v)}
        placeholder="Why It's Time to Lead"
      />

      <TextArea
        label="Sub Description (optional)"
        value={content.subDescription || ""}
        onChange={(v) => onChange("subDescription", v)}
        rows={2}
        placeholder="We're calling on school leaders, education departments..."
      />

      {/* Checklist Items */}
      <div className="swa-form-group">
        <label className="swa-label">Checklist Items</label>
        {(content.checklistItems || []).map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              className="swa-input"
              value={item}
              onChange={(e) => handleItemChange(i, e.target.value)}
              placeholder="Checklist item..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="swa-btn-secondary"
              style={{ padding: "8px 16px" }}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="swa-btn-secondary" style={{ width: "100%" }}>
          + Add Item
        </button>
      </div>

      {/* Background Color */}
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: "2px solid var(--color-border)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Background Color</h3>
        <ColorPicker
          label="Section Background Color"
          value={content.backgroundColor || "#E30982"}
          onChange={(v) => onChange("backgroundColor", v)}
        />
        <p style={{ fontSize: 12, color: "var(--color-text-faint)", marginTop: 6 }}>
          Should match the How to Participate block background for a seamless look.
        </p>
      </div>
    </>
  );
};
