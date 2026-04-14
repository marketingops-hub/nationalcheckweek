/**
 * Block-based content editor types
 */

export type BlockType = 
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'quote'
  | 'list'
  | 'code'
  | 'callout'
  | 'divider'
  | 'button'
  | 'spacer';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
  width?: 'small' | 'medium' | 'large' | 'full';
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: string;
  author?: string;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  style: 'bullet' | 'numbered';
  items: string[];
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  language: string;
  content: string;
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  variant: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  content: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  text: string;
  url: string;
  variant: 'primary' | 'secondary' | 'ghost';
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height: 'small' | 'medium' | 'large';
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | QuoteBlock
  | ListBlock
  | CodeBlock
  | CalloutBlock
  | DividerBlock
  | ButtonBlock
  | SpacerBlock;

export interface PageContent {
  version: number;
  blocks: ContentBlock[];
}
