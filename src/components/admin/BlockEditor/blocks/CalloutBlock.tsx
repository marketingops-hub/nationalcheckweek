import type { ContentBlock } from '../types';

interface CalloutBlockProps {
  block: ContentBlock & { type: 'callout' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function CalloutBlockEdit({ block, onChange }: CalloutBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <select
        value={block.variant}
        onChange={(e) => onChange({ ...block, variant: e.target.value as any })}
        className="swa-form-input"
      >
        <option value="info">Info (Blue)</option>
        <option value="warning">Warning (Yellow)</option>
        <option value="success">Success (Green)</option>
        <option value="error">Error (Red)</option>
      </select>
      <input
        type="text"
        value={block.title || ''}
        onChange={(e) => onChange({ ...block, title: e.target.value })}
        placeholder="Title (optional)..."
        className="swa-form-input"
      />
      <textarea
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="Callout content..."
        className="swa-form-textarea"
        rows={3}
      />
    </div>
  );
}

export function CalloutBlockPreview({ block }: CalloutBlockProps) {
  const colors = {
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  };
  const color = colors[block.variant];
  return (
    <div style={{ background: color.bg, border: `2px solid ${color.border}`, borderRadius: 8, padding: 16 }}>
      {block.title && <div style={{ fontWeight: 700, color: color.text, marginBottom: 8 }}>{block.title}</div>}
      <div style={{ color: color.text }}>{block.content || 'Empty callout'}</div>
    </div>
  );
}
