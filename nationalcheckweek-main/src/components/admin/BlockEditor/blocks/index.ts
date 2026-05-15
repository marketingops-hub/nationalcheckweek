/**
 * Block Registry - Central registry for all block types.
 * 
 * This file exports all block components and provides a type-safe
 * registry for looking up block edit and preview components.
 */

import type { ContentBlock } from '../types';
import { HeadingBlockEdit, HeadingBlockPreview } from './HeadingBlock';
import { ParagraphBlockEdit, ParagraphBlockPreview } from './ParagraphBlock';
import { ImageBlockEdit, ImageBlockPreview } from './ImageBlock';
import { QuoteBlockEdit, QuoteBlockPreview } from './QuoteBlock';
import { ListBlockEdit, ListBlockPreview } from './ListBlock';
import { CodeBlockEdit, CodeBlockPreview } from './CodeBlock';
import { CalloutBlockEdit, CalloutBlockPreview } from './CalloutBlock';
import { ButtonBlockEdit, ButtonBlockPreview } from './ButtonBlock';
import { SpacerBlockEdit, SpacerBlockPreview } from './SpacerBlock';
import { DividerBlockEdit, DividerBlockPreview } from './DividerBlock';

interface BlockComponent {
  Edit: React.ComponentType<{
    block: ContentBlock;
    isEditing: boolean;
    onChange: (block: ContentBlock) => void;
  }>;
  Preview: React.ComponentType<{
    block: ContentBlock;
    isEditing: boolean;
    onChange: (block: ContentBlock) => void;
  }>;
}

/**
 * Registry mapping block types to their edit and preview components.
 * Add new block types here to make them available in the editor.
 */
export const BLOCK_REGISTRY: Record<string, BlockComponent> = {
  heading: {
    Edit: HeadingBlockEdit as any,
    Preview: HeadingBlockPreview as any,
  },
  paragraph: {
    Edit: ParagraphBlockEdit as any,
    Preview: ParagraphBlockPreview as any,
  },
  image: {
    Edit: ImageBlockEdit as any,
    Preview: ImageBlockPreview as any,
  },
  quote: {
    Edit: QuoteBlockEdit as any,
    Preview: QuoteBlockPreview as any,
  },
  list: {
    Edit: ListBlockEdit as any,
    Preview: ListBlockPreview as any,
  },
  code: {
    Edit: CodeBlockEdit as any,
    Preview: CodeBlockPreview as any,
  },
  callout: {
    Edit: CalloutBlockEdit as any,
    Preview: CalloutBlockPreview as any,
  },
  button: {
    Edit: ButtonBlockEdit as any,
    Preview: ButtonBlockPreview as any,
  },
  spacer: {
    Edit: SpacerBlockEdit as any,
    Preview: SpacerBlockPreview as any,
  },
  divider: {
    Edit: DividerBlockEdit as any,
    Preview: DividerBlockPreview as any,
  },
};

/**
 * Get the edit component for a block type.
 * Returns a fallback component if the block type is not registered.
 */
export function getBlockEditComponent(blockType: string) {
  return BLOCK_REGISTRY[blockType]?.Edit || FallbackBlockEdit;
}

/**
 * Get the preview component for a block type.
 * Returns a fallback component if the block type is not registered.
 */
export function getBlockPreviewComponent(blockType: string) {
  return BLOCK_REGISTRY[blockType]?.Preview || FallbackBlockPreview;
}

/**
 * Fallback component for unknown block types in edit mode.
 */
function FallbackBlockEdit({ block }: any) {
  return null;
}

/**
 * Fallback component for unknown block types in preview mode.
 */
function FallbackBlockPreview({ block }: any) {
  return null;
}
