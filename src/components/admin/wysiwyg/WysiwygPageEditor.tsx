"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import type { Block, BlockType } from "@/components/admin/pageEditorTypes";
import WysiwygBlock from "./WysiwygBlock";
import AddBlockButton from "./AddBlockButton";
import WysiwygErrorBoundary from "./WysiwygErrorBoundary";
import HeadingBlock from "./blocks/HeadingBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import ImageBlock from "./blocks/ImageBlock";
import CtaBlock from "./blocks/CtaBlock";
import CalloutBlock from "./blocks/CalloutBlock";
import TwoColBlock from "./blocks/TwoColBlock";
import DividerBlock from "./blocks/DividerBlock";
import HtmlBlock from "./blocks/HtmlBlock";

interface Props {
  /** Current ordered list of page blocks from usePageEditor. */
  blocks: Block[];
  /** Called when the user picks a block type from an AddBlockButton. */
  onAdd: (type: BlockType, insertAt: number) => void;
  /** Called whenever a block's data changes (inline edit, upload, etc.). */
  onChange: (id: string, updated: Block) => void;
  /** Called when the user confirms block deletion. */
  onDelete: (id: string) => void;
  /** Called after a drag-and-drop reorder completes. */
  onReorder: (from: number, to: number) => void;
}

/** Renders the appropriate block component for the given block type. */
const BlockContent = React.memo(function BlockContent({ block, onChange, isSelected }: {
  block: Block;
  onChange: (b: Block) => void;
  isSelected: boolean;
}) {
  switch (block.type) {
    case "heading":   return <HeadingBlock block={block} onChange={onChange} isSelected={isSelected} />;
    case "paragraph": return <ParagraphBlock block={block} onChange={onChange} />;
    case "image":     return <ImageBlock block={block} onChange={onChange} />;
    case "cta":       return <CtaBlock block={block} onChange={onChange} isSelected={isSelected} />;
    case "callout":   return <CalloutBlock block={block} onChange={onChange} isSelected={isSelected} />;
    case "two-col":   return <TwoColBlock block={block} onChange={onChange} />;
    case "divider":   return <DividerBlock />;
    case "html":      return <HtmlBlock block={block} onChange={onChange} isSelected={isSelected} />;
    default:
      return <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--admin-text-muted)" }}>Unknown block: {block.type}</div>;
  }
});

/** Root WYSIWYG canvas: manages selected-block state, drag-and-drop reorder, and inline block insertion. */
export default function WysiwygPageEditor({ blocks, onAdd, onChange, onDelete, onReorder }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (canvasRef.current && !canvasRef.current.contains(e.target as Node)) {
        setSelectedId(null);
      }
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    onReorder(result.source.index, result.destination.index);
  }, [onReorder]);

  if (blocks.length === 0) {
    return (
      <WysiwygErrorBoundary>
      <div ref={canvasRef} className="wysiwyg-canvas wysiwyg-canvas-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3">
          <rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/>
          <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15" x2="13" y2="15"/>
        </svg>
        <p style={{ margin: "8px 0 16px", color: "var(--admin-text-muted)", fontSize: 14 }}>No blocks yet</p>
        <AddBlockButton onAdd={type => onAdd(type, 0)} />
      </div>
      </WysiwygErrorBoundary>
    );
  }

  return (
    <WysiwygErrorBoundary>
    <div ref={canvasRef} className="wysiwyg-canvas" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="wysiwyg-blocks">
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="wysiwyg-droppable">
              <AddBlockButton onAdd={type => onAdd(type, 0)} />
              {blocks.map((block, idx) => (
                <React.Fragment key={block.id}>
                  <Draggable draggableId={block.id} index={idx}>
                    {(drag, snapshot) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        style={{ ...drag.draggableProps.style, opacity: snapshot.isDragging ? 0.85 : 1 }}
                      >
                        <WysiwygBlock
                          block={block}
                          isSelected={selectedId === block.id}
                          onSelect={() => setSelectedId(block.id)}
                          onDelete={() => onDelete(block.id)}
                          dragHandleProps={drag.dragHandleProps}
                        >
                          <BlockContent
                            block={block}
                            onChange={updated => onChange(block.id, updated)}
                            isSelected={selectedId === block.id}
                          />
                        </WysiwygBlock>
                      </div>
                    )}
                  </Draggable>
                  <AddBlockButton onAdd={type => onAdd(type, idx + 1)} />
                </React.Fragment>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
    </WysiwygErrorBoundary>
  );
}
