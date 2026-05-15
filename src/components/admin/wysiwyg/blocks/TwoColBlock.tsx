"use client";

import { useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import BubbleToolbar from "@/components/admin/wysiwyg/BubbleToolbar";
import { useRichTextExtensions } from "@/components/admin/wysiwyg/useRichTextExtensions";
import type { Block } from "@/components/admin/pageEditorTypes";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

function ColEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder: string }) {
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const extensions = useRichTextExtensions(placeholder);

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML()),
    editorProps: { attributes: { class: "wysiwyg-prose" } },
    // See ParagraphBlock.tsx — required under Next 16 / React 19 to
    // avoid a hydration mismatch that leaves the column un-editable.
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="wysiwyg-col-editor" onClick={e => e.stopPropagation()}>
      <BubbleToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export default function TwoColBlock({ block, onChange }: Props) {
  function set(key: string, val: string) {
    onChange({ ...block, data: { ...block.data, [key]: val } });
  }
  return (
    <div className="wysiwyg-twocol-block">
      <ColEditor value={block.data.left ?? ""} onChange={v => set("left", v)} placeholder="Left column…" />
      <div className="wysiwyg-col-divider" />
      <ColEditor value={block.data.right ?? ""} onChange={v => set("right", v)} placeholder="Right column…" />
    </div>
  );
}
