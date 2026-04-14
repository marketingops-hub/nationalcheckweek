"use client";

import type { Block } from "@/components/admin/pageEditorTypes";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
  isSelected: boolean;
}

export default function HtmlBlock({ block, onChange, isSelected }: Props) {
  const charCount = block.data.html?.length ?? 0;

  return (
    <div className="wysiwyg-html-block" onClick={e => e.stopPropagation()}>
      {isSelected ? (
        <textarea
          className="wysiwyg-html-editor"
          value={block.data.html ?? ""}
          onChange={e => onChange({ ...block, data: { ...block.data, html: e.target.value } })}
          placeholder="<div>Custom HTML…</div>"
          rows={8}
          spellCheck={false}
          autoFocus
        />
      ) : (
        <div className="wysiwyg-html-preview">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          <span>
            {charCount > 0 ? `${charCount} chars of raw HTML` : "Empty HTML block — click to edit"}
          </span>
        </div>
      )}
    </div>
  );
}
