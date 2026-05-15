import type { ContentBlock } from '../types';

interface CodeBlockProps {
  block: ContentBlock & { type: 'code' };
  isEditing: boolean;
  onChange: (block: ContentBlock) => void;
}

export function CodeBlockEdit({ block, onChange }: CodeBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text"
        value={block.language}
        onChange={(e) => onChange({ ...block, language: e.target.value })}
        placeholder="Language (e.g., javascript, python)..."
        className="swa-form-input"
      />
      <textarea
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="Code..."
        className="swa-form-textarea"
        rows={8}
        style={{ fontFamily: 'monospace', fontSize: 13 }}
      />
    </div>
  );
}

export function CodeBlockPreview({ block }: CodeBlockProps) {
  return (
    <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: 16, borderRadius: 8, overflow: 'auto', margin: 0 }}>
      <code>{block.content || '// Empty code block'}</code>
    </pre>
  );
}
