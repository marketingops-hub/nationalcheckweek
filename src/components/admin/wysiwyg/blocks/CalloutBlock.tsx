"use client";

import React, { useRef, useEffect } from "react";
import type { Block } from "@/components/admin/pageEditorTypes";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
  isSelected: boolean;
}

const CALLOUT: Record<string, { border: string; icon: string }> = {
  info:    { border: "#3b82f6", icon: "ℹ" },
  warning: { border: "#f59e0b", icon: "⚠" },
  success: { border: "#10b981", icon: "✓" },
  danger:  { border: "#ef4444", icon: "!" },
};

/** Callout/alert box with inline-editable text and style toggle strip. Background adapts to theme via rgba. */
export default function CalloutBlock({ block, onChange, isSelected }: Props) {
  const textRef = useRef<HTMLDivElement>(null);
  const style = (block.data.style ?? "info") as keyof typeof CALLOUT;
  const s = CALLOUT[style] ?? CALLOUT.info;

  useEffect(() => {
    if (textRef.current && textRef.current.innerText !== (block.data.text ?? "")) {
      textRef.current.innerText = block.data.text ?? "";
    }
  }, [block.data.text]);

  function set(key: string, val: string) {
    onChange({ ...block, data: { ...block.data, [key]: val } });
  }

  return (
    <div className="wysiwyg-callout-block" onClick={e => e.stopPropagation()}>
      <div className="wysiwyg-callout" style={{ borderLeft: `4px solid ${s.border}`, background: `${s.border}12` }}>
        <span className="wysiwyg-callout-icon" style={{ color: s.border }}>{s.icon}</span>
        <div
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          className="wysiwyg-callout-text"
          data-placeholder="Callout text…"
          onInput={e => set("text", e.currentTarget.innerText)}
        />
      </div>
      {isSelected && (
        <div className="wysiwyg-settings-strip">
          <span style={{ fontSize: 12, color: "var(--admin-text-muted)", flexShrink: 0 }}>Style:</span>
          {Object.entries(CALLOUT).map(([k, v]) => (
            <button
              key={k}
              className={`wysiwyg-callout-style-btn${style === k ? " active" : ""}`}
              style={{ "--callout-color": v.border } as React.CSSProperties}
              onMouseDown={e => { e.preventDefault(); set("style", k); }}
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
