/**
 * How To Participate Block Editor Component
 */

import React from "react";
import type { HowToParticipateBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface HowToParticipateBlockEditorProps {
  content: HowToParticipateBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const HowToParticipateBlockEditor: React.FC<HowToParticipateBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);
  const handleFeatureChange = (index: number, value: string) => {
    const updatedFeatures = [...(content.features || [])];
    updatedFeatures[index] = value;
    onChange("features", updatedFeatures);
  };

  const addFeature = () => {
    onChange("features", [...(content.features || []), ""]);
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = content.features.filter((_, i) => i !== index);
    onChange("features", updatedFeatures);
  };

  return (
    <>
      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="How to Participate"
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(value) => onChange("description", value)}
        placeholder="Description text..."
        rows={4}
      />

      <div className="swa-form-group">
        <label className="swa-label">Features List</label>
        {content.features?.map((feature, index) => (
          <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              value={feature || ""}
              onChange={(e) => handleFeatureChange(index, e.target.value)}
              className="swa-input"
              placeholder="Feature description..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeFeature(index)}
              className="swa-btn-secondary"
              style={{ padding: "8px 16px" }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFeature}
          className="swa-btn-secondary"
          style={{ width: "100%" }}
        >
          + Add Feature
        </button>
      </div>

      <TextInput
        label="Form Heading (optional)"
        value={content.formHeading || ""}
        onChange={(value) => onChange("formHeading", value)}
        placeholder="Register Your School"
      />

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>integration_instructions</span>
          HubSpot Form Integration
        </h3>

        <TextInput
          label="HubSpot Portal ID"
          value={content.hubspotPortalId || ""}
          onChange={(value) => onChange("hubspotPortalId", value)}
          placeholder="4596264"
          helpText="Your HubSpot portal ID (e.g., 4596264)"
        />

        <TextInput
          label="HubSpot Form ID"
          value={content.hubspotFormId || ""}
          onChange={(value) => onChange("hubspotFormId", value)}
          placeholder="39d34e87-dd2e-4f88-8434-fc42555bea5c"
          helpText="Your HubSpot form ID (e.g., 39d34e87-dd2e-4f88-8434-fc42555bea5c)"
        />

        <TextInput
          label="HubSpot Region (optional)"
          value={content.hubspotRegion || ""}
          onChange={(value) => onChange("hubspotRegion", value)}
          placeholder="ap1"
          helpText="HubSpot region (default: ap1 for Asia Pacific)"
        />
      </div>

      {/* Color Customization Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>palette</span>
          Colors
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
          <ColorPicker
            label="Section Background Color"
            value={(content as any).backgroundColor || '#E30982'}
            onChange={(value) => onChange('backgroundColor', value)}
          />

          <ColorPicker
            label="Accent Color (borders & buttons)"
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
        <p style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 8 }}>
          Set the same background color as the "If Not Now When" block below it for a seamless pink section.
        </p>
      </div>
    </>
  );
};
