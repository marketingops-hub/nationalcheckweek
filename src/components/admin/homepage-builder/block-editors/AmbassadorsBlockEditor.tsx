/**
 * Ambassadors Block Editor Component
 * 
 * Provides editing interface for ambassadors section including:
 * - Heading and description
 * - Multiple ambassadors with name, title, image, and bio
 * - Image upload for each ambassador
 * - Add/remove ambassadors
 * 
 * @component
 */

import React from "react";
import ImageUpload from "../../ImageUpload";
import type { AmbassadorsBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea } from "@/components/admin/forms";

interface AmbassadorsBlockEditorProps {
  content: AmbassadorsBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const AmbassadorsBlockEditor: React.FC<AmbassadorsBlockEditorProps> = ({ content, onChange }) => {
  const handleAmbassadorChange = (index: number, field: string, value: string) => {
    const updatedAmbassadors = [...(content.ambassadors || [])];
    updatedAmbassadors[index] = {
      ...updatedAmbassadors[index],
      [field]: value,
    };
    onChange("ambassadors", updatedAmbassadors);
  };

  const addAmbassador = () => {
    const newAmbassador = {
      name: "",
      title: "",
      image: "",
      bio: "",
    };
    onChange("ambassadors", [...(content.ambassadors || []), newAmbassador]);
  };

  const removeAmbassador = (index: number) => {
    const updatedAmbassadors = content.ambassadors.filter((_, i) => i !== index);
    onChange("ambassadors", updatedAmbassadors);
  };

  return (
    <>
      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="A national movement driving change in student wellbeing"
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(value) => onChange("description", value)}
        placeholder="Describe the ambassadors and their role..."
        rows={4}
      />

      <div className="swa-form-group">
        <label className="swa-label">Ambassadors</label>
        {content.ambassadors?.map((ambassador, index) => (
          <div key={index} style={{ 
            border: "1px solid #e4e2ec", 
            borderRadius: "8px", 
            padding: "16px", 
            marginBottom: "16px",
            background: "#f8f9fa"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <strong>Ambassador {index + 1}</strong>
              <button
                type="button"
                onClick={() => removeAmbassador(index)}
                className="swa-btn-secondary"
                style={{ padding: "4px 12px", fontSize: "0.875rem" }}
              >
                Remove
              </button>
            </div>

            <TextInput
              label="Name"
              value={ambassador.name || ""}
              onChange={(value) => handleAmbassadorChange(index, "name", value)}
              placeholder="Ambassador Name"
            />

            <TextInput
              label="Title/Organization"
              value={ambassador.title || ""}
              onChange={(value) => handleAmbassadorChange(index, "title", value)}
              placeholder="Role or Organization"
            />

            <div className="swa-form-group">
              <ImageUpload
                label="Photo"
                value={ambassador.image || ""}
                onChange={(url: string) => handleAmbassadorChange(index, "image", url)}
                description="Upload ambassador photo (max 5MB)"
              />
            </div>

            <TextArea
              label="Bio (Optional)"
              value={ambassador.bio || ""}
              onChange={(value) => handleAmbassadorChange(index, "bio", value)}
              placeholder="Short bio or description..."
              rows={2}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addAmbassador}
          className="swa-btn-secondary"
          style={{ width: "100%" }}
        >
          + Add Ambassador
        </button>
      </div>
    </>
  );
};
