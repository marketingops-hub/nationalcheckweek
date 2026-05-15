"use client";

import React, { useState, useRef, useEffect } from "react";
import { BLOCK_TYPES } from "@/components/admin/blockTypes";
import type { BlockType } from "@/components/admin/pageEditorTypes";

interface Props {
  /** Called with the chosen block type when the user selects from the picker. */
  onAdd: (type: BlockType) => void;
}

/** Inline '+' divider between blocks that opens a floating block-type picker. */
export default function AddBlockButton({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="wysiwyg-add-block">
      <button
        className="wysiwyg-add-btn"
        onMouseDown={e => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label="Add block here"
        aria-expanded={open}
        aria-haspopup="true"
        title="Add block"
      >
        <span className="wysiwyg-add-line" />
        <span className="wysiwyg-add-circle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
        <span className="wysiwyg-add-line" />
      </button>

      {open && (
        <div className="wysiwyg-block-picker" onMouseDown={e => e.stopPropagation()}>
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.type}
              className="wysiwyg-picker-btn"
              onMouseDown={() => { onAdd(bt.type); setOpen(false); }}
              title={`Add ${bt.label}`}
            >
              <span className="wysiwyg-picker-icon" style={{ background: `${bt.color}18`, color: bt.color }}>
                {bt.icon}
              </span>
              <span className="wysiwyg-picker-label">{bt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
