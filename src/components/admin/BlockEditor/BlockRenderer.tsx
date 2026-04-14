/**
 * BlockRenderer - Renders individual content blocks with edit/preview modes.
 * 
 * This component uses a registry-based system to dynamically render different
 * block types. Each block type has its own dedicated edit and preview components.
 * 
 * Features:
 * - Registry-based block rendering
 * - Edit and preview modes
 * - Block controls (move up/down, delete)
 * - Extensible architecture for adding new block types
 * 
 * @example
 * ```tsx
 * <BlockRenderer
 *   block={contentBlock}
 *   isEditing={true}
 *   onChange={handleChange}
 *   onDelete={handleDelete}
 *   onMoveUp={handleMoveUp}
 *   onMoveDown={handleMoveDown}
 *   isFirst={false}
 *   isLast={false}
 * />
 * ```
 */

import { useMemo } from 'react';
import type { ContentBlock } from './types';
import { getBlockEditComponent, getBlockPreviewComponent } from './blocks';

interface BlockRendererProps {
  /** The content block to render */
  block: ContentBlock;
  /** Whether the block is in edit mode */
  isEditing: boolean;
  /** Callback when block content changes */
  onChange: (block: ContentBlock) => void;
  /** Callback to delete the block */
  onDelete: () => void;
  /** Callback to move block up */
  onMoveUp: () => void;
  /** Callback to move block down */
  onMoveDown: () => void;
  /** Whether this is the first block */
  isFirst: boolean;
  /** Whether this is the last block */
  isLast: boolean;
}

export default function BlockRenderer({
  block,
  isEditing,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockRendererProps) {
  
  // Get the appropriate component from the registry
  // Use useMemo to prevent component recreation on every render
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const BlockComponent = useMemo(
    () => isEditing 
      ? getBlockEditComponent(block.type)
      : getBlockPreviewComponent(block.type),
    [isEditing, block.type]
  );

  return (
    <div
      style={{
        position: 'relative',
        padding: 16,
        border: '2px solid',
        borderColor: isEditing ? 'var(--color-primary)' : 'var(--color-border)',
        borderRadius: 8,
        background: 'white',
      }}
      data-testid={`block-${block.type}`}
    >
      {/* Block Controls */}
      <div 
        style={{ 
          position: 'absolute', 
          top: -12, 
          right: 8, 
          display: 'flex', 
          gap: 4, 
          background: 'white', 
          padding: '0 8px' 
        }}
      >
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          style={{
            padding: '4px 8px',
            fontSize: 12,
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            background: 'white',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            opacity: isFirst ? 0.5 : 1,
          }}
          title="Move up"
          aria-label="Move block up"
          data-testid="move-up-button"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          style={{
            padding: '4px 8px',
            fontSize: 12,
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            background: 'white',
            cursor: isLast ? 'not-allowed' : 'pointer',
            opacity: isLast ? 0.5 : 1,
          }}
          title="Move down"
          aria-label="Move block down"
          data-testid="move-down-button"
        >
          ↓
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '4px 8px',
            fontSize: 12,
            border: '1px solid #EF4444',
            borderRadius: 4,
            background: 'white',
            color: '#EF4444',
            cursor: 'pointer',
          }}
          title="Delete block"
          aria-label="Delete block"
          data-testid="delete-button"
        >
          ×
        </button>
      </div>

      {/* Block Type Label */}
      <div 
        style={{ 
          fontSize: 11, 
          fontWeight: 600, 
          color: 'var(--color-text-faint)', 
          marginBottom: 12, 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em' 
        }}
      >
        {block.type}
      </div>

      {/* Block Content - Rendered by registry component */}
      <BlockComponent 
        block={block} 
        isEditing={isEditing} 
        onChange={onChange} 
      />
    </div>
  );
}
