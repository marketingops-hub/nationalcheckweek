/**
 * Partners Slideshow Block Editor Component
 */

import React from "react";
import { TextInput } from "@/components/admin/forms";

interface PartnersSlideshowBlockEditorProps {
  content: { heading?: string };
  onChange: (key: string, value: unknown) => void;
}

export const PartnersSlideshowBlockEditor: React.FC<PartnersSlideshowBlockEditorProps> = ({ content, onChange }) => {
  return (
    <>
      <div style={{ padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
        <strong>ℹ️ Live Data:</strong> Partners are pulled dynamically from the Partners database.
        Add or edit partners in the{' '}
        <a href="/admin/partners" target="_blank" style={{ color: 'var(--color-primary)' }}>Partners admin</a>.
        The slideshow shows 2 partners per slide and auto-advances every 5 seconds.
      </div>

      <TextInput
        label="Section Heading"
        value={content.heading || ''}
        onChange={(value) => onChange('heading', value)}
        placeholder="Our Partners"
      />
    </>
  );
};
