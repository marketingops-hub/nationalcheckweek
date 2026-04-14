import type { ContentBlock } from '../types';

interface ParagraphBlockProps {
  block: ContentBlock & { type: 'paragraph' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function ParagraphBlockEdit({ block, onChange }: ParagraphBlockProps) {
  return (
    <textarea
      value={block.content}
      onChange={(e) => onChange({ ...block, content: e.target.value })}
      placeholder="Paragraph text..."
      className="swa-form-textarea"
      rows={4}
      style={{ fontSize: 15, lineHeight: 1.7 }}
    />
  );
}

export function ParagraphBlockPreview({ block }: ParagraphBlockProps) {
  return <p style={{ margin: 0, lineHeight: 1.7 }}>{block.content || 'Empty paragraph'}</p>;
}
