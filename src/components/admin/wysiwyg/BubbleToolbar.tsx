"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";

interface Props {
  /** The active TipTap editor instance to bind formatting commands to. */
  editor: Editor;
  /** Whether to show the link button and inline URL popover. Default: false. */
  showLink?: boolean;
}

/**
 * Floating rich-text toolbar that appears above any text selection.
 * Position is computed via `window.getSelection()` and batched with `requestAnimationFrame`
 * to avoid per-keystroke React state updates. Rendered into `document.body` via a portal.
 */
export default function BubbleToolbar({ editor, showLink = false }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const updateRect = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { empty } = editor.state.selection;
      if (empty) { setRect(null); setLinkOpen(false); return; }
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) { setRect(null); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      if (r.width === 0) { setRect(null); return; }
      setRect(r);
    });
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updateRect);
    editor.on("transaction", updateRect);
    return () => {
      editor.off("selectionUpdate", updateRect);
      editor.off("transaction", updateRect);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [editor, updateRect]);

  function openLink() {
    const current = editor.getAttributes("link").href ?? "";
    setLinkValue(current);
    setLinkOpen(true);
    setTimeout(() => linkInputRef.current?.focus(), 0);
  }

  function applyLink() {
    if (linkValue.trim() === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: linkValue.trim() }).run();
    }
    setLinkOpen(false);
  }

  if (!rect) return null;

  const top = rect.top - (linkOpen ? 90 : 48);
  const left = rect.left + rect.width / 2;

  return createPortal(
    <div
      className="wysiwyg-bubble-menu"
      style={{ position: "fixed", top, left, transform: "translateX(-50%)", zIndex: 9999, flexDirection: "column", gap: linkOpen ? 4 : 2 }}
      onMouseDown={e => e.preventDefault()}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "active" : ""} aria-label="Bold"><b>B</b></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "active" : ""} aria-label="Italic"><i>I</i></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "active" : ""} aria-label="Strike"><s>S</s></button>
        <div className="wysiwyg-bubble-sep" />
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "active" : ""} aria-label="H2"><span style={{ fontSize: 11, fontWeight: 700 }}>H2</span></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? "active" : ""} aria-label="H3"><span style={{ fontSize: 11, fontWeight: 700 }}>H3</span></button>
        <div className="wysiwyg-bubble-sep" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "active" : ""} aria-label="Bullet list">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
        </button>
        {showLink && (
          <button onClick={openLink} className={editor.isActive("link") ? "active" : ""} aria-label="Link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        )}
      </div>
      {linkOpen && (
        <div className="wysiwyg-bubble-link-row">
          <input
            ref={linkInputRef}
            className="wysiwyg-bubble-link-input"
            value={linkValue}
            onChange={e => setLinkValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") setLinkOpen(false); }}
            placeholder="https://…"
            aria-label="Link URL"
          />
          <button onClick={applyLink} className="wysiwyg-bubble-link-apply" aria-label="Apply link">✓</button>
          {editor.isActive("link") && (
            <button onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false); }} aria-label="Remove link" title="Remove link">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
