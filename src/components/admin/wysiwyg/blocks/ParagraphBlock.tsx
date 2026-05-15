"use client";

import { useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import BubbleToolbar from "@/components/admin/wysiwyg/BubbleToolbar";
import { useRichTextExtensions } from "@/components/admin/wysiwyg/useRichTextExtensions";
import type { Block } from "@/components/admin/pageEditorTypes";

interface Props {
  /** Block data — only `data.text` (HTML string) is used. */
  block: Block;
  /** Called on every content change with the full updated block. */
  onChange: (b: Block) => void;
}

/** TipTap rich-text paragraph block with a floating BubbleToolbar and inline link popover. */
export default function ParagraphBlock({ block, onChange }: Props) {
  const blockRef = useRef(block);
  useEffect(() => { blockRef.current = block; }, [block]);

  const extensions = useRichTextExtensions("Click to write…");

  const editor = useEditor({
    extensions,
    content: block.data.text ?? "",
    onUpdate: ({ editor }) => onChange({ ...blockRef.current, data: { ...blockRef.current.data, text: editor.getHTML() } }),
    editorProps: { attributes: { class: "wysiwyg-prose" } },
    // Required under Next 16 / React 19. Without it Tiptap runs its
    // initial render on the server where ProseMirror's DOM APIs are
    // unavailable, which shows up as a hydration-mismatch warning and
    // leaves the editor un-interactable until a manual refresh.
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="wysiwyg-paragraph-block" onClick={e => e.stopPropagation()}>
      <BubbleToolbar editor={editor} showLink />
      <EditorContent editor={editor} />
    </div>
  );
}
