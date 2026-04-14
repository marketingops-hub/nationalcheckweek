"use client";

import React from "react";
import type { Block } from "@/components/admin/pageEditorTypes";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
  isSelected: boolean;
}

const BTN_STYLE: Record<string, React.CSSProperties> = {
  primary:   { background: "#6366f1", color: "#fff", border: "2px solid #6366f1" },
  secondary: { background: "transparent", color: "#6366f1", border: "2px solid #6366f1" },
  outline:   { background: "transparent", color: "#374151", border: "2px solid #d1d5db" },
};

export default function CtaBlock({ block, onChange, isSelected }: Props) {
  function set(key: string, val: string) {
    onChange({ ...block, data: { ...block.data, [key]: val } });
  }
  const styleKey = (block.data.style ?? "primary") as keyof typeof BTN_STYLE;

  return (
    <div className="wysiwyg-cta-block" onClick={e => e.stopPropagation()}>
      <div className="wysiwyg-cta-preview">
        <span className="wysiwyg-cta-btn" style={BTN_STYLE[styleKey] ?? BTN_STYLE.primary}>
          {block.data.label || "Button"}
        </span>
        {block.data.href && (
          <span className="wysiwyg-cta-url">{block.data.href}</span>
        )}
      </div>
      {isSelected && (
        <div className="wysiwyg-settings-strip">
          <input
            placeholder="Button label"
            value={block.data.label ?? ""}
            onChange={e => set("label", e.target.value)}
          />
          <input
            placeholder="URL (e.g. /page or https://…)"
            value={block.data.href ?? ""}
            onChange={e => set("href", e.target.value)}
            style={{ flex: 2 }}
          />
          <select value={block.data.style ?? "primary"} onChange={e => set("style", e.target.value)}>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
          </select>
        </div>
      )}
    </div>
  );
}
