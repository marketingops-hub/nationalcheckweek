/**
 * Ambassador Voices Block Editor Component
 */

import React from "react";
import { TextInput, TextArea } from "@/components/admin/forms";

interface AmbassadorVoicesBlockEditorProps {
  content: {
    heading?: string;
    description?: string;
    buttonText?: string;
    buttonColor?: string;
  };
  onChange: (key: string, value: unknown) => void;
}

export const AmbassadorVoicesBlockEditor: React.FC<AmbassadorVoicesBlockEditorProps> = ({ content, onChange }) => {
  return (
    <>
      <div style={{ padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
        <strong>ℹ️ Live Data:</strong> Ambassador cards are pulled dynamically from the Ambassadors database. Add comments and event links to ambassadors in the{' '}
        <a href="/admin/ambassadors" target="_blank" style={{ color: 'var(--color-primary)' }}>Ambassadors admin</a>.
        Only ambassadors with a Comment will appear in this block.
      </div>

      <TextInput
        label="Section Heading"
        value={content.heading || ''}
        onChange={(value) => onChange('heading', value)}
        placeholder="A national movement driving change in student wellbeing"
      />

      <TextArea
        label="Section Description"
        value={content.description || ''}
        onChange={(value) => onChange('description', value)}
        placeholder="National Check-In Week is bringing together ambassadors, partners, experts..."
        rows={4}
      />

      <TextInput
        label="Button Text"
        value={content.buttonText || ''}
        onChange={(value) => onChange('buttonText', value)}
        placeholder="Register for events I'm involved in here"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Button Color
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="color"
            value={content.buttonColor || '#29B8E8'}
            onChange={(e) => onChange('buttonColor', e.target.value)}
            style={{ width: 48, height: 36, borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer', padding: 2 }}
          />
          <input
            type="text"
            value={content.buttonColor || '#29B8E8'}
            onChange={(e) => onChange('buttonColor', e.target.value)}
            placeholder="#29B8E8"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
          />
        </div>
      </div>
    </>
  );
};
