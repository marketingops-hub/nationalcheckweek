"use client";

import { useState, useRef, useCallback } from "react";
import { adminFetch } from "@/lib/adminFetch";
import type { Block } from "@/components/admin/pageEditorTypes";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export default function ImageBlock({ block, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "pages");
      const res = await adminFetch("/api/admin/upload", { method: "POST", body: fd });
      const { url } = await res.json();
      if (!url) throw new Error("No URL returned from upload");
      onChange({ ...block, data: { ...block.data, src: url } });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [block, onChange]);

  function set(key: string, val: string) {
    onChange({ ...block, data: { ...block.data, [key]: val } });
  }

  const hasSrc = !!block.data.src;

  return (
    <div className="wysiwyg-image-block" onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />

      {!hasSrc ? (
        <div
          className={`wysiwyg-drop-zone${dragging ? " is-dragging" : ""}${uploading ? " is-uploading" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/"));
            if (file) upload(file);
          }}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <div className="wysiwyg-drop-uploading">
              <svg className="wysiwyg-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>
              <span>Uploading…</span>
            </div>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="wysiwyg-drop-label">Drop image here or <u>click to browse</u></span>
              <span className="wysiwyg-drop-hint">JPG · PNG · WebP · GIF &nbsp;·&nbsp; max 5 MB</span>
              {uploadError && <span className="wysiwyg-drop-error">{uploadError}</span>}
            </>
          )}
        </div>
      ) : (
        <div className="wysiwyg-image-preview">
          <img src={block.data.src} alt={block.data.alt ?? ""} className="wysiwyg-image-img" />
          <div className="wysiwyg-image-overlay">
            <input
              className="wysiwyg-image-meta-input"
              placeholder="Alt text (describe the image)…"
              value={block.data.alt ?? ""}
              onChange={e => set("alt", e.target.value)}
            />
            <input
              className="wysiwyg-image-meta-input"
              placeholder="Caption (optional)…"
              value={block.data.caption ?? ""}
              onChange={e => set("caption", e.target.value)}
            />
            <button
              className="wysiwyg-image-replace-btn"
              onClick={() => onChange({ ...block, data: { ...block.data, src: "" } })}
            >
              Replace image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
