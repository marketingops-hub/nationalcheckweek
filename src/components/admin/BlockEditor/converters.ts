/**
 * Converters between HTML and block format
 */

import type { ContentBlock, PageContent } from './types';

/**
 * Convert HTML string to block format
 * This is a basic converter - can be enhanced with a proper HTML parser
 */
export function htmlToBlocks(html: string): PageContent {
  const blocks: ContentBlock[] = [];
  
  // Simple HTML parsing - split by common block-level tags
  const lines = html.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const id = `block_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Heading
    if (line.match(/^<h([1-6])>(.*?)<\/h\1>$/i)) {
      const match = line.match(/^<h([1-6])>(.*?)<\/h\1>$/i);
      if (match) {
        blocks.push({
          id,
          type: 'heading',
          level: parseInt(match[1]) as 1 | 2 | 3 | 4 | 5 | 6,
          content: stripHtml(match[2]),
        });
        continue;
      }
    }
    
    // Paragraph
    if (line.match(/^<p>(.*?)<\/p>$/i)) {
      const match = line.match(/^<p>(.*?)<\/p>$/i);
      if (match) {
        blocks.push({
          id,
          type: 'paragraph',
          content: stripHtml(match[1]),
        });
        continue;
      }
    }
    
    // Image
    if (line.match(/<img\s+[^>]*src="([^"]*)"[^>]*>/i)) {
      const match = line.match(/<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"/i);
      if (match) {
        blocks.push({
          id,
          type: 'image',
          url: match[1],
          alt: match[2] || '',
          width: 'full',
        });
        continue;
      }
    }
    
    // Blockquote
    if (line.match(/^<blockquote>(.*?)<\/blockquote>$/i)) {
      const match = line.match(/^<blockquote>(.*?)<\/blockquote>$/i);
      if (match) {
        blocks.push({
          id,
          type: 'quote',
          content: stripHtml(match[1]),
        });
        continue;
      }
    }
    
    // Horizontal rule
    if (line.match(/^<hr\s*\/?>$/i)) {
      blocks.push({
        id,
        type: 'divider',
      });
      continue;
    }
    
    // Default: treat as paragraph if it has content
    if (line && !line.match(/^<\/?[a-z]+[^>]*>$/i)) {
      blocks.push({
        id,
        type: 'paragraph',
        content: stripHtml(line),
      });
    }
  }
  
  // If no blocks were created, add an empty paragraph
  if (blocks.length === 0) {
    blocks.push({
      id: `block_${Date.now()}_0`,
      type: 'paragraph',
      content: '',
    });
  }
  
  return { version: 1, blocks };
}

/**
 * Convert block format to HTML string
 */
export function blocksToHtml(content: PageContent): string {
  return content.blocks.map(block => {
    switch (block.type) {
      case 'heading':
        return `<h${block.level}>${escapeHtml(block.content)}</h${block.level}>`;
      
      case 'paragraph':
        return `<p>${escapeHtml(block.content)}</p>`;
      
      case 'image':
        const widthStyle = block.width === 'small' ? 'max-width: 400px;' : 
                          block.width === 'medium' ? 'max-width: 600px;' : 
                          block.width === 'large' ? 'max-width: 800px;' : 
                          'max-width: 100%;';
        return `<figure style="text-align: center;">
  <img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" style="${widthStyle} border-radius: 8px;" />
  ${block.caption ? `<figcaption style="font-size: 0.9rem; color: #6b7280; margin-top: 8px;">${escapeHtml(block.caption)}</figcaption>` : ''}
</figure>`;
      
      case 'quote':
        return `<blockquote style="border-left: 4px solid var(--color-primary); padding-left: 20px; font-style: italic;">
  <p>${escapeHtml(block.content)}</p>
  ${block.author ? `<cite style="font-size: 0.9rem; color: #6b7280;">— ${escapeHtml(block.author)}</cite>` : ''}
</blockquote>`;
      
      case 'list':
        const tag = block.style === 'numbered' ? 'ol' : 'ul';
        return `<${tag}>
${block.items.map(item => `  <li>${escapeHtml(item)}</li>`).join('\n')}
</${tag}>`;
      
      case 'code':
        return `<pre style="background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow: auto;">
  <code class="language-${escapeHtml(block.language)}">${escapeHtml(block.content)}</code>
</pre>`;
      
      case 'callout':
        const colors = {
          info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
          warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
          success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
          error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
        };
        const color = colors[block.variant];
        return `<div style="background: ${color.bg}; border: 2px solid ${color.border}; border-radius: 8px; padding: 16px;">
  ${block.title ? `<div style="font-weight: 700; color: ${color.text}; margin-bottom: 8px;">${escapeHtml(block.title)}</div>` : ''}
  <div style="color: ${color.text};">${escapeHtml(block.content)}</div>
</div>`;
      
      case 'button':
        const btnClass = block.variant === 'primary' ? 'swa-btn swa-btn--primary' : 
                        block.variant === 'ghost' ? 'swa-btn swa-btn--ghost' : 
                        'swa-btn';
        return `<div style="text-align: center;">
  <a href="${escapeHtml(block.url)}" class="${btnClass}">${escapeHtml(block.text)}</a>
</div>`;
      
      case 'spacer':
        const heights = { small: '24px', medium: '48px', large: '96px' };
        return `<div style="height: ${heights[block.height]};"></div>`;
      
      case 'divider':
        return '<hr style="border: none; border-top: 2px solid var(--color-border); margin: 32px 0;" />';
      
      default:
        return '';
    }
  }).join('\n\n');
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Check if content is in our block format (JSON)
 */
export function isBlockFormat(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' && 'version' in parsed && 'blocks' in parsed;
  } catch {
    return false;
  }
}

/**
 * Check if content is in Editor.js format
 */
export function isEditorJsFormat(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) && parsed.length > 0 && parsed[0].type && parsed[0].data;
  } catch {
    return false;
  }
}

/**
 * Convert Editor.js format to our block format
 */
export function editorJsToBlocks(editorJsBlocks: any[]): PageContent {
  const blocks: ContentBlock[] = editorJsBlocks.map((block, index) => {
    const id = block.id || `block_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (block.type) {
      case 'heading':
        return {
          id,
          type: 'heading',
          level: (block.data.level || 2) as 1 | 2 | 3 | 4 | 5 | 6,
          content: block.data.text || '',
        };
      
      case 'paragraph':
        return {
          id,
          type: 'paragraph',
          content: stripHtml(block.data.text || ''),
        };
      
      case 'image':
        return {
          id,
          type: 'image',
          url: block.data.url || block.data.file?.url || '',
          alt: block.data.caption || '',
          caption: block.data.caption,
          width: 'full',
        };
      
      case 'quote':
        return {
          id,
          type: 'quote',
          content: block.data.text || '',
          author: block.data.caption,
        };
      
      case 'list':
        return {
          id,
          type: 'list',
          style: block.data.style === 'ordered' ? 'numbered' : 'bullet',
          items: block.data.items || [],
        };
      
      case 'code':
        return {
          id,
          type: 'code',
          language: 'javascript',
          content: block.data.code || '',
        };
      
      case 'delimiter':
        return {
          id,
          type: 'divider',
        };
      
      default:
        // Unknown block type - convert to paragraph
        return {
          id,
          type: 'paragraph',
          content: JSON.stringify(block.data),
        };
    }
  });
  
  return { version: 1, blocks };
}

/**
 * Parse content - auto-detect format and convert to blocks
 */
export function parseContent(content: string): PageContent {
  if (!content || content.trim() === '') {
    return {
      version: 1,
      blocks: [{
        id: `block_${Date.now()}_0`,
        type: 'paragraph',
        content: '',
      }],
    };
  }
  
  // Check if it's our block format
  if (isBlockFormat(content)) {
    return JSON.parse(content);
  }
  
  // Check if it's Editor.js format
  if (isEditorJsFormat(content)) {
    const editorJsBlocks = JSON.parse(content);
    return editorJsToBlocks(editorJsBlocks);
  }
  
  // Otherwise treat as HTML
  return htmlToBlocks(content);
}
