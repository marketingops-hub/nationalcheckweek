"use client";

import React, { useState, memo } from "react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { BLOCK_TYPES } from "@/components/admin/blockTypes";
import type { Block } from "@/components/admin/pageEditorTypes";

interface Props {
  /** The block being rendered — used to look up display metadata (icon, color, label). */
  block: Block;
  /** Whether this block currently has the selection ring. */
  isSelected: boolean;
  /** Called when the user clicks/mousedowns the block wrapper. */
  onSelect: () => void;
  /** Called after the user confirms the delete dialog. */
  onDelete: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  children: React.ReactNode;
}

/**
 * Wrapper rendered around every block in the WYSIWYG canvas.
 * Shows a blue selection ring when active and a floating action bar
 * (drag handle · type badge · delete) on hover or selection.
 */
const WysiwygBlock = memo(function WysiwygBlock({ block, isSelected, onSelect, onDelete, dragHandleProps, children }: Props) {
  const [hovered, setHovered] = useState(false);
  const meta = BLOCK_TYPES.find(b => b.type === block.type);
  const showActions = hovered || isSelected;

  return (
    <div
      className={`wysiwyg-block${isSelected ? " is-selected" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={onSelect}
    >
      {/* Floating action bar — appears on hover/select */}
      {showActions && (
        <div className="wysiwyg-block-actions">
          <div
            {...(dragHandleProps ?? {})}
            className="wysiwyg-drag-handle"
            title="Drag to reorder"
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" opacity="0.5">
              <circle cx="2.5" cy="2" r="1.5"/><circle cx="7.5" cy="2" r="1.5"/>
              <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
              <circle cx="2.5" cy="12" r="1.5"/><circle cx="7.5" cy="12" r="1.5"/>
            </svg>
          </div>
          {meta && (
            <span
              className="wysiwyg-block-badge"
              style={{ background: `${meta.color}18`, color: meta.color }}
            >
              {meta.icon}
              {meta.label}
            </span>
          )}
          <button
            className="wysiwyg-delete-btn"
            onMouseDown={e => {
              e.stopPropagation();
              if (window.confirm("Delete this block? This cannot be undone.")) onDelete();
            }}
            aria-label="Delete block"
            title="Delete block"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      <div className="wysiwyg-block-content">
        {children}
      </div>
    </div>
  );
});

export default WysiwygBlock;
