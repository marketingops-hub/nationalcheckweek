"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { HomepageBlock } from "@/types/homepage-blocks";
import { BLOCK_ICONS, SUPPORTED_BLOCK_TYPES, EDITOR_REGISTRY } from "./block-constants";

interface HomepageBlockItemProps {
  block: HomepageBlock;
  index: number;
  onSave: (block: HomepageBlock) => Promise<void>;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDelete: (id: string, title: string) => void;
}

/**
 * Inline accordion block item — editing expands in-place, no modal needed
 */
const HomepageBlockItem = memo(({
  block,
  index,
  onSave,
  onToggleVisibility,
  onDelete,
}: HomepageBlockItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => { setEditedContent(block.content); }, [block.id]);

  const updateContent = useCallback((key: string, value: unknown) => {
    setEditedContent(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave({ ...block, content: editedContent });
      setExpanded(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(block.content);
    setSaveError("");
    setExpanded(false);
  };

  const EditorComponent = EDITOR_REGISTRY[block.block_type];

  return (
    <Draggable draggableId={block.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? "var(--color-bg-subtle)" : "var(--color-card)",
            border: `2px solid ${expanded ? "var(--color-primary)" : snapshot.isDragging ? "var(--color-primary)" : "var(--color-border)"}`,
            borderRadius: 10,
            overflow: "hidden",
            opacity: block.is_visible ? 1 : 0.55,
            transition: snapshot.isDragging ? undefined : "border-color 0.15s ease, opacity 0.2s ease",
          }}
        >
          {/* ── Collapsed header row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
            <div
              {...provided.dragHandleProps}
              style={{ cursor: "grab", color: "var(--color-text-muted)", flexShrink: 0 }}
              aria-label="Drag to reorder"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>drag_indicator</span>
            </div>

            <button
              onClick={() => setExpanded(e => !e)}
              style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, minWidth: 0 }}
              aria-expanded={expanded}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: "var(--color-primary)", flexShrink: 0 }}
                aria-hidden="true"
              >
                {BLOCK_ICONS[block.block_type] || "widgets"}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-body)" }}>
                  {block.title || block.block_type}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                  {block.block_type.replace(/_/g, " ")} block
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-text-muted)", flexShrink: 0, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                expand_more
              </span>
            </button>

            <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={() => onToggleVisibility(block.id, block.is_visible)}
                className="swa-icon-btn"
                title={block.is_visible ? "Hide block" : "Show block"}
                aria-label={block.is_visible ? "Hide block" : "Show block"}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {block.is_visible ? "visibility" : "visibility_off"}
                </span>
              </button>
              <button
                onClick={() => onDelete(block.id, block.title)}
                className="swa-icon-btn"
                style={{ color: "#EF4444" }}
                aria-label="Delete block"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          </div>

          {/* ── Inline editor (expanded) ── */}
          {expanded && (
            <div style={{ borderTop: "1px solid var(--color-border)", padding: "20px 20px 16px" }}>
              {EditorComponent ? (
                <EditorComponent content={editedContent} onChange={updateContent} />
              ) : (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13, background: "var(--color-bg-subtle)", borderRadius: 8 }}>
                  No editor available for block type <code style={{ fontFamily: "monospace" }}>{block.block_type}</code>.
                </div>
              )}

              {saveError && (
                <div role="alert" style={{ fontSize: 13, color: "#dc2626", padding: "8px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fca5a5" }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, paddingTop: 16, marginTop: 4, borderTop: "1px solid var(--color-border)" }}>
                <button onClick={handleSave} disabled={saving} className="swa-btn swa-btn--primary" style={{ minWidth: 120 }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={handleCancel} disabled={saving} className="swa-btn">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});

HomepageBlockItem.displayName = "HomepageBlockItem";
export default HomepageBlockItem;
