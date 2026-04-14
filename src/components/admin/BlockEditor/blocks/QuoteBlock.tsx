import type { ContentBlock } from '../types';

interface QuoteBlockProps {
  block: ContentBlock & { type: 'quote' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function QuoteBlockEdit({ block, onChange }: QuoteBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="Quote text..."
        className="swa-form-textarea"
        rows={3}
      />
      <input
        type="text"
        value={block.author || ''}
        onChange={(e) => onChange({ ...block, author: e.target.value })}
        placeholder="Author (optional)..."
        className="swa-form-input"
      />
    </div>
  );
}

export function QuoteBlockPreview({ block }: QuoteBlockProps) {
  return (
    <blockquote style={{ borderLeft: '4px solid var(--color-primary)', paddingLeft: 20, margin: 0, fontStyle: 'italic' }}>
      <p style={{ margin: 0, marginBottom: 8 }}>{block.content || 'Empty quote'}</p>
      {block.author && <cite style={{ fontSize: 14, color: '#6b7280' }}>— {block.author}</cite>}
    </blockquote>
  );
}
