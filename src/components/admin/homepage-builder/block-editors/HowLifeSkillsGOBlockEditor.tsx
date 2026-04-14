/**
 * How Life Skills GO Block Editor Component
 * 
 * Provides editing interface for How Life Skills GO section including:
 * - Heading
 * - Multiple paragraphs
 * - Image upload
 * 
 * @component
 */

import React from "react";
import ImageUpload from "../../ImageUpload";
import type { HowLifeSkillsGOBlockContent } from "@/types/homepage-blocks";
import { TextInput } from "@/components/admin/forms";

interface HowLifeSkillsGOBlockEditorProps {
  content: HowLifeSkillsGOBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const HowLifeSkillsGOBlockEditor: React.FC<HowLifeSkillsGOBlockEditorProps> = ({ content, onChange }) => {
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
        placeholder="How is Life Skills GO Powering NCIW?"
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
              rows={4}
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

      <div className="swa-form-group">
        <ImageUpload
          label="Image"
          value={content.image || ""}
          onChange={(url: string) => onChange("image", url)}
          description="Upload image for right column (max 5MB)"
        />
      </div>
    </>
  );
};
