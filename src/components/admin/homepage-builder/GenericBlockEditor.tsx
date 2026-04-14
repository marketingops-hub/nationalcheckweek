"use client";

import { useState } from "react";
import BlockColorOverride from "../BlockColorOverride";

interface GenericBlockEditorProps {
  block: any;
  onSave: (block: any) => void;
  onCancel: () => void;
  availableColors?: string[];
  children: React.ReactNode;
}

export default function GenericBlockEditor({
  block,
  onSave,
  onCancel,
  availableColors = ['primaryButton', 'accentColor', 'backgroundColor', 'heading', 'subheading'],
  children
}: GenericBlockEditorProps) {
  const [editedBlock, setEditedBlock] = useState(block);

  function handleColorChange(colors: any) {
    setEditedBlock({
      ...editedBlock,
      content: {
        ...editedBlock.content,
        colors,
      },
    });
  }

  function handleSave() {
    onSave(editedBlock);
  }

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: "rgba(0,0,0,0.5)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{ 
        background: "var(--color-card)", 
        borderRadius: 12, 
        maxWidth: 800, 
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ 
          padding: 24, 
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          background: "var(--color-card)",
          zIndex: 1
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Edit {block.title || block.block_type}
          </h3>
        </div>

        <div style={{ padding: 24 }}>
          {/* Block-specific content editor passed as children */}
          {children}

          {/* Color Override Section */}
          <BlockColorOverride
            colors={editedBlock.content?.colors}
            onChange={handleColorChange}
            availableColors={availableColors}
          />
        </div>

        <div style={{ 
          padding: 24, 
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
          position: "sticky",
          bottom: 0,
          background: "var(--color-card)"
        }}>
          <button onClick={onCancel} className="swa-btn">
            Cancel
          </button>
          <button onClick={handleSave} className="swa-btn swa-btn--primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
