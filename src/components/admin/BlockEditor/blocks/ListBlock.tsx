import type { ContentBlock } from '../types';

interface ListBlockProps {
  block: ContentBlock & { type: 'list' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function ListBlockEdit({ block, onChange }: ListBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <select
        value={block.style}
        onChange={(e) => onChange({ ...block, style: e.target.value as 'bullet' | 'numbered' })}
        className="swa-form-input"
      >
        <option value="bullet">Bullet List</option>
        <option value="numbered">Numbered List</option>
      </select>
      {block.items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const newItems = [...block.items];
              newItems[idx] = e.target.value;
              onChange({ ...block, items: newItems });
            }}
            placeholder={`Item ${idx + 1}...`}
            className="swa-form-input"
          />
          <button
            onClick={() => {
              const newItems = block.items.filter((_, i) => i !== idx);
              onChange({ ...block, items: newItems });
            }}
            style={{
              padding: '8px 12px',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange({ ...block, items: [...block.items, ''] })}
        className="swa-btn swa-btn--ghost"
        style={{ fontSize: 13 }}
      >
        + Add Item
      </button>
    </div>
  );
}

export function ListBlockPreview({ block }: ListBlockProps) {
  const ListTag = block.style === 'numbered' ? 'ol' : 'ul';
  return (
    <ListTag style={{ margin: 0, paddingLeft: 24 }}>
      {block.items.map((item, idx) => (
        <li key={idx}>{item || '(empty)'}</li>
      ))}
    </ListTag>
  );
}
