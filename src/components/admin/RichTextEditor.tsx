"use client";

import { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type ToolbarBtn = { title: string; icon: React.ReactNode; action: () => void; active?: boolean };

function Btn({ title, icon, action, active }: ToolbarBtn) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`rte-toolbar-btn${active ? " is-active" : ""}`}
      onMouseDown={(e) => { e.preventDefault(); action(); }}
    >
      {icon}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 200 }: Props) {
  const extensions = useMemo(() => [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
    Placeholder.configure({ placeholder: placeholder ?? "Start typing…" }),
  ], [placeholder]);

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "rte-body", style: `min-height:${minHeight}px` },
    },
    // Next 16 / React 19 SSR hygiene — see wysiwyg/blocks/ParagraphBlock.tsx.
    immediatelyRender: false,
  });

  // Sync value changes from outside (e.g. cancel/reset)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  function setLink() {
    const prev = editor!.getAttributes("link").href ?? "";
    const url = prompt("URL:", prev);
    if (url === null) return;
    if (url === "") { editor!.chain().focus().unsetLink().run(); return; }
    editor!.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar">
        <div className="rte-toolbar-group">
          <Btn title="Bold (Ctrl+B)"         active={editor.isActive("bold")}          action={() => editor.chain().focus().toggleBold().run()}          icon={<b>B</b>} />
          <Btn title="Italic (Ctrl+I)"       active={editor.isActive("italic")}        action={() => editor.chain().focus().toggleItalic().run()}        icon={<i>I</i>} />
          <Btn title="Strikethrough"         active={editor.isActive("strike")}        action={() => editor.chain().focus().toggleStrike().run()}        icon={<s>S</s>} />
          <Btn title="Code"                  active={editor.isActive("code")}          action={() => editor.chain().focus().toggleCode().run()}          icon={<code style={{fontSize:11}}>{"<>"}</code>} />
        </div>
        <div className="rte-toolbar-group">
          <Btn title="Heading 1" active={editor.isActive("heading",{level:1})} action={() => editor.chain().focus().toggleHeading({level:1}).run()} icon={<span style={{fontSize:11,fontWeight:700}}>H1</span>} />
          <Btn title="Heading 2" active={editor.isActive("heading",{level:2})} action={() => editor.chain().focus().toggleHeading({level:2}).run()} icon={<span style={{fontSize:11,fontWeight:700}}>H2</span>} />
          <Btn title="Heading 3" active={editor.isActive("heading",{level:3})} action={() => editor.chain().focus().toggleHeading({level:3}).run()} icon={<span style={{fontSize:11,fontWeight:700}}>H3</span>} />
          <Btn title="Paragraph" active={editor.isActive("paragraph")}         action={() => editor.chain().focus().setParagraph().run()}              icon={<span style={{fontSize:13}}>¶</span>} />
        </div>
        <div className="rte-toolbar-group">
          <Btn title="Bullet list"   active={editor.isActive("bulletList")}   action={() => editor.chain().focus().toggleBulletList().run()}   icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>} />
          <Btn title="Ordered list" active={editor.isActive("orderedList")} action={() => editor.chain().focus().toggleOrderedList().run()} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="10" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">1.</text></svg>} />
          <Btn title="Blockquote" active={editor.isActive("blockquote")} action={() => editor.chain().focus().toggleBlockquote().run()} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>} />
        </div>
        <div className="rte-toolbar-group">
          <Btn title="Insert / edit link" active={editor.isActive("link")} action={setLink} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} />
          <Btn title="Remove link" action={() => editor.chain().focus().unsetLink().run()} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="2" y1="2" x2="22" y2="22"/></svg>} />
        </div>
        <div className="rte-toolbar-group">
          <Btn title="Undo (Ctrl+Z)" action={() => editor.chain().focus().undo().run()} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>} />
          <Btn title="Redo (Ctrl+Y)"  action={() => editor.chain().focus().redo().run()} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>} />
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
