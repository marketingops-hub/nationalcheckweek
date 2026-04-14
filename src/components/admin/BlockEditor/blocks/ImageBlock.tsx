import type { ContentBlock } from '../types';

interface ImageBlockProps {
  block: ContentBlock & { type: 'image' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function ImageBlockEdit({ block, onChange }: ImageBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="url"
        value={block.url}
        onChange={(e) => onChange({ ...block, url: e.target.value })}
        placeholder="Image URL..."
        className="swa-form-input"
      />
      <input
        type="text"
        value={block.alt}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
        placeholder="Alt text..."
        className="swa-form-input"
      />
      <input
        type="text"
        value={block.caption || ''}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)..."
        className="swa-form-input"
      />
      <select
        value={block.width || 'full'}
        onChange={(e) => onChange({ ...block, width: e.target.value as any })}
        className="swa-form-input"
      >
        <option value="small">Small (400px)</option>
        <option value="medium">Medium (600px)</option>
        <option value="large">Large (800px)</option>
        <option value="full">Full Width</option>
      </select>
      {block.url && (
        <img src={block.url} alt={block.alt} style={{ maxWidth: '100%', borderRadius: 8 }} />
      )}
    </div>
  );
}

export function ImageBlockPreview({ block }: ImageBlockProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      {block.url ? (
        <img
          src={block.url}
          alt={block.alt}
          style={{
            maxWidth: block.width === 'small' ? 400 : block.width === 'medium' ? 600 : block.width === 'large' ? 800 : '100%',
            borderRadius: 8,
          }}
        />
      ) : (
        <div style={{ padding: 40, background: '#f3f4f6', borderRadius: 8, color: '#9ca3af' }}>
          No image URL
        </div>
      )}
      {block.caption && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>{block.caption}</div>}
    </div>
  );
}
