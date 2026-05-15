/**
 * Block Editor - Modern block-based content editor
 */

'use client';

import { useState } from 'react';
import type { ContentBlock, BlockType, PageContent } from './types';
import BlockRenderer from './BlockRenderer';

interface Props {
  initialContent: PageContent;
  onChange: (content: PageContent) => void;
}

export default function BlockEditor({ initialContent, onChange }: Props) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialContent.blocks);

  const updateBlocks = (newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks);
    onChange({ version: 1, blocks: newBlocks });
  };

  const addBlock = (type: BlockType) => {
    const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let newBlock: ContentBlock;
    
    switch (type) {
      case 'heading':
        newBlock = { id, type: 'heading', level: 2, content: '' };
        break;
      case 'paragraph':
        newBlock = { id, type: 'paragraph', content: '' };
        break;
      case 'image':
        newBlock = { id, type: 'image', url: '', alt: '', width: 'full' };
        break;
      case 'quote':
        newBlock = { id, type: 'quote', content: '' };
        break;
      case 'list':
        newBlock = { id, type: 'list', style: 'bullet', items: [''] };
        break;
      case 'code':
        newBlock = { id, type: 'code', language: 'javascript', content: '' };
        break;
      case 'callout':
        newBlock = { id, type: 'callout', variant: 'info', content: '' };
        break;
      case 'divider':
        newBlock = { id, type: 'divider' };
        break;
      case 'button':
        newBlock = { id, type: 'button', text: '', url: '', variant: 'primary' };
        break;
      case 'spacer':
        newBlock = { id, type: 'spacer', height: 'medium' };
        break;
      default:
        return;
    }

    updateBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updatedBlock: ContentBlock) => {
    updateBlocks(blocks.map(b => b.id === id ? updatedBlock : b));
  };

  const deleteBlock = (id: string) => {
    updateBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    updateBlocks(newBlocks);
  };

  return (
    <div>
      {/* Block Palette */}
      <div style={{
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Add Block
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { type: 'heading' as BlockType, icon: '📝', label: 'Heading' },
            { type: 'paragraph' as BlockType, icon: '¶', label: 'Paragraph' },
            { type: 'image' as BlockType, icon: '🖼️', label: 'Image' },
            { type: 'quote' as BlockType, icon: '💬', label: 'Quote' },
            { type: 'list' as BlockType, icon: '📋', label: 'List' },
            { type: 'code' as BlockType, icon: '💻', label: 'Code' },
            { type: 'callout' as BlockType, icon: '💡', label: 'Callout' },
            { type: 'button' as BlockType, icon: '🔘', label: 'Button' },
            { type: 'divider' as BlockType, icon: '—', label: 'Divider' },
            { type: 'spacer' as BlockType, icon: '↕️', label: 'Spacer' },
          ].map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                background: 'white',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.background = 'var(--color-primary-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.background = 'white';
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blocks */}
      {blocks.length === 0 ? (
        <div style={{
          padding: 80,
          textAlign: 'center',
          border: '2px dashed var(--color-border)',
          borderRadius: 8,
          color: 'var(--color-text-faint)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No content blocks yet</div>
          <div style={{ fontSize: 14 }}>Click a block type above to get started</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {blocks.map((block, index) => (
            <BlockRenderer
              key={block.id}
              block={block}
              isEditing={true}
              onChange={(updatedBlock) => updateBlock(block.id, updatedBlock)}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={() => moveBlock(block.id, 'up')}
              onMoveDown={() => moveBlock(block.id, 'down')}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
            />
          ))}
        </div>
      )}

      {/* Block Count */}
      {blocks.length > 0 && (
        <div style={{
          marginTop: 24,
          padding: 12,
          background: 'var(--color-bg)',
          borderRadius: 6,
          fontSize: 13,
          color: 'var(--color-text-faint)',
          textAlign: 'center',
        }}>
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
