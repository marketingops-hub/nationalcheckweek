"use client";

import { useRef, useEffect } from "react";
import type { Block } from "@/components/admin/pageEditorTypes";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
  isSelected: boolean;
}

const SIZE: Record<string, string> = { h1: "2rem", h2: "1.5rem", h3: "1.2rem", h4: "1rem" };

export default function HeadingBlock({ block, onChange, isSelected }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const level = (block.data.level ?? "h2") as keyof typeof SIZE;

  useEffect(() => {
    if (ref.current && ref.current.innerText !== (block.data.text ?? "")) {
      ref.current.innerText = block.data.text ?? "";
    }
  }, [block.data.text]);

  return (
    <div className="wysiwyg-heading-block">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="wysiwyg-heading-editable"
        data-placeholder={`${level.toUpperCase()} heading…`}
        style={{ fontSize: SIZE[level] ?? SIZE.h2 }}
        onInput={e => onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } })}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); } }}
      />
      {isSelected && (
        <div className="wysiwyg-heading-levels">
          {(["h1", "h2", "h3", "h4"] as const).map(l => (
            <button
              key={l}
              className={`wysiwyg-level-btn${level === l ? " active" : ""}`}
              onMouseDown={e => { e.preventDefault(); onChange({ ...block, data: { ...block.data, level: l } }); }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
