import type { ContentBlock } from '../types';

interface DividerBlockProps {
  block: ContentBlock & { type: 'divider' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function DividerBlockEdit({ block, onChange }: DividerBlockProps) {
  return <div style={{ color: 'var(--color-text-faint)', fontSize: 13 }}>Horizontal divider</div>;
}

export function DividerBlockPreview({ block }: DividerBlockProps) {
  return <hr style={{ border: 'none', borderTop: '2px solid var(--color-border)', margin: 0 }} />;
}
