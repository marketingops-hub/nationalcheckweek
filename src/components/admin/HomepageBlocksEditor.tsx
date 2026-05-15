"use client";

import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useHomepageBlocks } from "./homepage-builder/hooks/useHomepageBlocks";
import HomepageBlockItem from "./homepage-builder/HomepageBlockItem";
import { HOMEPAGE_BLOCK_DEFS, BLOCK_DEF_BY_TYPE, BLOCK_ICONS } from "./homepage-builder/block-constants";
import type { BlockType } from "@/types/homepage-blocks";

/**
 * Main Homepage Blocks Editor Component
 */
export default function HomepageBlocksEditor() {
  const {
    blocks,
    loading,
    error,
    success,
    createBlock,
    updateBlockOrder,
    toggleVisibility,
    saveBlock,
    deleteBlock,
  } = useHomepageBlocks();

  const [showAddPicker, setShowAddPicker] = useState(false);
  const [adding, setAdding] = useState<BlockType | null>(null);

  const handleAddBlock = useCallback(async (type: BlockType) => {
    const def = BLOCK_DEF_BY_TYPE.get(type);
    if (!def) return;
    setAdding(type);
    try {
      await createBlock(type, def.label, def.defaultContent);
      setShowAddPicker(false);
    } finally {
      setAdding(null);
    }
  }, [createBlock]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateBlockOrder(items.map((block, index) => ({ ...block, display_order: index + 1 })));
  }, [blocks, updateBlockOrder]);

  if (loading) {
    return (
      <div className="swa-card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          Loading homepage blocks...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {error && (
        <div className="swa-alert swa-alert--error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="swa-alert swa-alert--success" role="status">
          {success}
        </div>
      )}

      <div className="swa-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Homepage Content Blocks</h2>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
              Drag to reorder • Click to edit • Toggle visibility
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setShowAddPicker(p => !p)}
              className="swa-btn swa-btn--primary"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Add Block
            </button>
            <a 
              href="/" 
              target="_blank"
              rel="noopener noreferrer"
              className="swa-btn"
              style={{ 
                background: "var(--color-card)", 
                border: "1px solid var(--color-border)", 
                color: "var(--color-text-body)", 
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
              Preview
            </a>
          </div>
        </div>

        {/* Add Block Picker */}
        {showAddPicker && (
          <div style={{ marginBottom: 16, padding: 16, background: "var(--color-bg-subtle, #f9fafb)", borderRadius: 10, border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--color-text-muted)" }}>Choose a block type to add:</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {HOMEPAGE_BLOCK_DEFS.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handleAddBlock(type)}
                  disabled={adding !== null}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                    border: "1px solid var(--color-border)", borderRadius: 8,
                    background: adding === type ? "var(--color-primary)" : "var(--color-card)",
                    color: adding === type ? "#fff" : "var(--color-text-body)",
                    cursor: adding !== null ? "wait" : "pointer", fontSize: 13, fontWeight: 500,
                    transition: "background 0.15s, border-color 0.15s",
                    opacity: adding !== null && adding !== type ? 0.5 : 1,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>
                    {BLOCK_ICONS[type] ?? "widgets"}
                  </span>
                  {adding === type ? "Adding…" : label}
                </button>
              ))}
            </div>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {blocks.map((block, index) => (
                  <HomepageBlockItem
                    key={block.id}
                    block={block}
                    index={index}
                    onSave={saveBlock}
                    onToggleVisibility={toggleVisibility}
                    onDelete={deleteBlock}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {blocks.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
            <p>No blocks found. Run the database migration to create default blocks.</p>
          </div>
        )}
      </div>

    </div>
  );
}
