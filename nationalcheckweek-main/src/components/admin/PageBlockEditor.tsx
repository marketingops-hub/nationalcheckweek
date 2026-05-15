"use client";

import React, { useState, useRef, useCallback } from "react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import type { Block, BlockType } from "@/components/admin/pageEditorTypes";
import { BLOCK_TYPES } from "@/components/admin/blockTypes";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { adminFetch } from "@/lib/adminFetch";

export { BLOCK_TYPES };

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}


const CALLOUT_COLORS: Record<string, string> = {
  info: "#3b82f6", warning: "#f59e0b", success: "#10b981", danger: "#ef4444",
};

function BlockPreview({ block }: { block: Block }) {
  const d = block.data;
  switch (block.type) {
    case "heading":
      return (
        <span style={{ fontWeight: 700, fontSize: d.level === "h1" ? 20 : d.level === "h2" ? 17 : 15, color: "var(--admin-text-primary)" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--admin-text-subtle)", marginRight: 6, textTransform: "uppercase" }}>{d.level?.toUpperCase()}</span>
          {d.text || <em style={{ opacity: 0.4 }}>Empty heading</em>}
        </span>
      );
    case "paragraph": {
      const plain = stripHtml(d.text ?? "");
      return <span style={{ fontSize: 13, color: "var(--admin-text-muted)", lineHeight: 1.5 }}>{plain ? (plain.length > 120 ? plain.slice(0, 120) + "…" : plain) : <em style={{ opacity: 0.4 }}>Empty paragraph</em>}</span>;
    }
    case "image":
      return (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {d.src
            ? <img src={d.src} alt={d.alt || ""} style={{ width: 40, height: 28, objectFit: "cover", borderRadius: 4, border: "1px solid var(--admin-border)" }} />
            : <span style={{ width: 40, height: 28, background: "var(--admin-bg-subtle)", borderRadius: 4, border: "1px dashed var(--admin-border)", display: "inline-block" }} />}
          <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>{d.alt || d.src || <em style={{ opacity: 0.4 }}>No image set</em>}</span>
        </span>
      );
    case "cta":
      return (
        <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, background: "var(--admin-accent)", color: "#fff", fontSize: 12, fontWeight: 600 }}>
          {d.label || "Button"}
        </span>
      );
    case "callout":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 6, background: `${CALLOUT_COLORS[d.style] ?? "#3b82f6"}18`, borderLeft: `3px solid ${CALLOUT_COLORS[d.style] ?? "#3b82f6"}`, fontSize: 13, color: "var(--admin-text-primary)" }}>
          {d.text ? (d.text.length > 80 ? d.text.slice(0, 80) + "…" : d.text) : <em style={{ opacity: 0.4 }}>Empty callout</em>}
        </span>
      );
    case "two-col": {
      const leftPlain = stripHtml(d.left ?? "");
      return <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>{leftPlain ? leftPlain.slice(0, 50) + (leftPlain.length > 50 ? "…" : "") : <em style={{ opacity: 0.4 }}>Two-column layout</em>}</span>;
    }
    case "divider":
      return <span style={{ display: "block", width: "100%", borderTop: "2px dashed var(--admin-border)", marginTop: 6 }} />;
    case "html":
      return <span style={{ fontFamily: "monospace", fontSize: 12, color: "#ef4444" }}>{d.html ? (d.html.length > 80 ? d.html.slice(0, 80) + "…" : d.html) : <em style={{ fontFamily: "inherit", opacity: 0.4 }}>Empty HTML block</em>}</span>;
    default:
      return null;
  }
}

interface BlockEditorProps {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

function ImageUpload({ onUrl }: { onUrl: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "pages");
      const res = await adminFetch("/api/admin/upload", { method: "POST", body: fd });
      const { url } = await res.json();
      if (!url) throw new Error("Upload succeeded but no URL was returned");
      onUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUrl]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <button
        type="button"
        className="admin-btn admin-btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{ marginTop: 6 }}
      >
        {uploading ? "Uploading…" : "Upload image"}
      </button>
      {uploadError && <p style={{ fontSize: 12, color: "var(--admin-danger)", marginTop: 4 }}>{uploadError}</p>}
    </>
  );
}

export default function PageBlockEditor({ block, onChange, onDelete, dragHandleProps }: BlockEditorProps) {
  const [open, setOpen] = useState(false);

  function set(key: string, val: string) {
    onChange({ ...block, data: { ...block.data, [key]: val } });
  }

  const meta = BLOCK_TYPES.find(b => b.type === block.type);

  if (!meta) {
    return (
      <div className="admin-block-editor" style={{ borderLeft: "3px solid #94a3b8", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--admin-text-muted)", padding: "0 4px" }}>
          Unknown block type: <code style={{ fontSize: 12 }}>{block.type}</code>
        </span>
        <button onClick={onDelete} className="admin-icon-btn admin-icon-btn-danger" aria-label="Delete block" title="Delete unknown block">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="admin-block-editor" style={{ borderLeft: `3px solid ${meta?.color ?? "var(--admin-border)"}` }}>
      {/* Collapsed header — always visible */}
      <div className="admin-block-toolbar" style={{ cursor: "default" }}>
        {/* Drag handle */}
        <div
          {...(dragHandleProps ?? {})}
          className="admin-block-drag"
          title="Drag to reorder"
          style={{ cursor: "grab", touchAction: "none" }}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" opacity="0.4">
            <circle cx="2.5" cy="2" r="1.5"/><circle cx="7.5" cy="2" r="1.5"/>
            <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
            <circle cx="2.5" cy="12" r="1.5"/><circle cx="7.5" cy="12" r="1.5"/>
          </svg>
        </div>

        {/* Type badge */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 20, background: `${meta?.color ?? "#94a3b8"}18`, color: meta?.color ?? "#94a3b8", fontSize: 11, fontWeight: 700, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {meta?.icon}
          {meta?.label}
        </span>

        {/* Preview */}
        <button
          className="admin-block-toggle"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{ flex: 1, minWidth: 0, textAlign: "left", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", overflow: "hidden" }}
        >
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <BlockPreview block={block} />
          </span>
          <svg
            style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Delete */}
        <button onClick={onDelete} className="admin-icon-btn admin-icon-btn-danger" aria-label="Delete block" title="Delete block">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>

      {/* Expanded edit fields */}
      {open && (
        <div className="admin-block-body">
          {block.type === "heading" && (
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <div className="admin-field">
                <label className="admin-field-label">Level</label>
                <select value={block.data.level} onChange={e => set("level", e.target.value)}>
                  {["h1","h2","h3","h4"].map(h => <option key={h} value={h}>{h.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-field-label">Text</label>
                <input value={block.data.text} onChange={e => set("text", e.target.value)} placeholder="Heading text…" />
              </div>
            </div>
          )}

          {block.type === "paragraph" && (
            <div className="admin-field">
              <label className="admin-field-label">Content</label>
              <RichTextEditor
                value={block.data.text ?? ""}
                onChange={html => set("text", html)}
                placeholder="Write your paragraph…"
                minHeight={160}
              />
            </div>
          )}

          {block.type === "image" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="admin-field col-span-2">
                <label className="admin-field-label">Image URL</label>
                <input value={block.data.src} onChange={e => set("src", e.target.value)} placeholder="https://… or upload below" />
                <ImageUpload onUrl={url => set("src", url)} />
              </div>
              <div className="admin-field">
                <label className="admin-field-label">Alt Text</label>
                <input value={block.data.alt} onChange={e => set("alt", e.target.value)} placeholder="Describe the image…" />
              </div>
              <div className="admin-field">
                <label className="admin-field-label">Caption <span className="admin-field-optional">(optional)</span></label>
                <input value={block.data.caption} onChange={e => set("caption", e.target.value)} />
              </div>
            </div>
          )}

          {block.type === "cta" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="admin-field col-span-2">
                <label className="admin-field-label">Button Label</label>
                <input value={block.data.label} onChange={e => set("label", e.target.value)} />
              </div>
              <div className="admin-field">
                <label className="admin-field-label">Style</label>
                <select value={block.data.style} onChange={e => set("style", e.target.value)}>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="outline">Outline</option>
                </select>
              </div>
              <div className="admin-field col-span-3">
                <label className="admin-field-label">URL</label>
                <input value={block.data.href} onChange={e => set("href", e.target.value)} placeholder="/ or https://…" />
              </div>
            </div>
          )}

          {block.type === "callout" && (
            <div className="grid grid-cols-[160px_1fr] gap-4">
              <div className="admin-field">
                <label className="admin-field-label">Style</label>
                <select value={block.data.style} onChange={e => set("style", e.target.value)}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="danger">Danger</option>
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-field-label">Content</label>
                <textarea rows={3} value={block.data.text} onChange={e => set("text", e.target.value)} />
              </div>
            </div>
          )}

          {block.type === "two-col" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="admin-field">
                <label className="admin-field-label">Left Column</label>
                <RichTextEditor value={block.data.left ?? ""} onChange={html => set("left", html)} minHeight={160} />
              </div>
              <div className="admin-field">
                <label className="admin-field-label">Right Column</label>
                <RichTextEditor value={block.data.right ?? ""} onChange={html => set("right", html)} minHeight={160} />
              </div>
            </div>
          )}

          {block.type === "divider" && (
            <div className="admin-block-divider-preview"><hr /></div>
          )}

          {block.type === "html" && (
            <div className="admin-field">
              <label className="admin-field-label">Raw HTML</label>
              <textarea rows={7} className="admin-code-field" value={block.data.html} onChange={e => set("html", e.target.value)} placeholder="<div>Custom HTML…</div>" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
