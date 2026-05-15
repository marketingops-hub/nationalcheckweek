import type { ContentBlock } from '../types';

interface ButtonBlockProps {
  block: ContentBlock & { type: 'button' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function ButtonBlockEdit({ block, onChange }: ButtonBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text"
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Button text..."
        className="swa-form-input"
      />
      <input
        type="url"
        value={block.url}
        onChange={(e) => onChange({ ...block, url: e.target.value })}
        placeholder="Button URL..."
        className="swa-form-input"
      />
      <select
        value={block.variant}
        onChange={(e) => onChange({ ...block, variant: e.target.value as any })}
        className="swa-form-input"
      >
        <option value="primary">Primary</option>
        <option value="secondary">Secondary</option>
        <option value="ghost">Ghost</option>
      </select>
    </div>
  );
}

export function ButtonBlockPreview({ block }: ButtonBlockProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <a
        href={block.url}
        className={`swa-btn ${block.variant === 'primary' ? 'swa-btn--primary' : block.variant === 'ghost' ? 'swa-btn--ghost' : ''}`}
        style={{ display: 'inline-block', pointerEvents: 'none' }}
      >
        {block.text || 'Button'}
      </a>
    </div>
  );
}
