import type { ContentBlock } from '../types';

interface HeadingBlockProps {
  block: ContentBlock & { type: 'heading' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function HeadingBlockEdit({ block, onChange }: HeadingBlockProps) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select
          value={block.level}
          onChange={(e) => onChange({ ...block, level: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 })}
          style={{
            padding: '4px 8px',
            fontSize: 12,
            border: '1px solid var(--color-border)',
            borderRadius: 4,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map(level => (
            <option key={level} value={level}>H{level}</option>
          ))}
        </select>
      </div>
      <input
        type="text"
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="Heading text..."
        className="swa-form-input"
        style={{ fontSize: block.level === 1 ? 32 : block.level === 2 ? 24 : 18, fontWeight: 700 }}
      />
    </div>
  );
}

export function HeadingBlockPreview({ block }: HeadingBlockProps) {
  const headingStyles = { margin: 0 };
  const content = block.content || 'Empty heading';
  
  if (block.level === 1) return <h1 style={headingStyles}>{content}</h1>;
  if (block.level === 2) return <h2 style={headingStyles}>{content}</h2>;
  if (block.level === 3) return <h3 style={headingStyles}>{content}</h3>;
  if (block.level === 4) return <h4 style={headingStyles}>{content}</h4>;
  if (block.level === 5) return <h5 style={headingStyles}>{content}</h5>;
  return <h6 style={headingStyles}>{content}</h6>;
}
