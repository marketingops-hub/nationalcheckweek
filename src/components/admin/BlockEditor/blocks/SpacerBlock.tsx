import type { ContentBlock } from '../types';

interface SpacerBlockProps {
  block: ContentBlock & { type: 'spacer' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function SpacerBlockEdit({ block, onChange }: SpacerBlockProps) {
  return (
    <select
      value={block.height}
      onChange={(e) => onChange({ ...block, height: e.target.value as any })}
      className="swa-form-input"
    >
      <option value="small">Small (24px)</option>
      <option value="medium">Medium (48px)</option>
      <option value="large">Large (96px)</option>
    </select>
  );
}

export function SpacerBlockPreview({ block }: SpacerBlockProps) {
  const heights = { small: 24, medium: 48, large: 96 };
  return <div style={{ height: heights[block.height], background: 'repeating-linear-gradient(0deg, transparent, transparent 4px, #e5e7eb 4px, #e5e7eb 5px)' }} />;
}
