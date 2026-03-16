"use client";

import { useRef, useEffect, useCallback } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLS: { cmd: string; icon: string; title: string; arg?: string }[][] = [
  [
    { cmd: "bold",          icon: "<b>B</b>",  title: "Bold" },
    { cmd: "italic",        icon: "<i>I</i>",  title: "Italic" },
    { cmd: "underline",     icon: "<u>U</u>",  title: "Underline" },
    { cmd: "strikeThrough", icon: "<s>S</s>",  title: "Strikethrough" },
  ],
  [
    { cmd: "formatBlock", icon: "H2", title: "Heading 2", arg: "h2" },
    { cmd: "formatBlock", icon: "H3", title: "Heading 3", arg: "h3" },
    { cmd: "formatBlock", icon: "¶",  title: "Paragraph", arg: "p"  },
  ],
  [
    { cmd: "insertUnorderedList", icon: "≡", title: "Bullet list" },
    { cmd: "insertOrderedList",   icon: "1≡", title: "Numbered list" },
  ],
  [
    { cmd: "indent",  icon: "→", title: "Indent" },
    { cmd: "outdent", icon: "←", title: "Outdent" },
  ],
  [
    { cmd: "removeFormat", icon: "✕",  title: "Clear formatting" },
  ],
];

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 200 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value → DOM only when value changes from outside
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      isInternalChange.current = true;
      el.innerHTML = value;
      isInternalChange.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (isInternalChange.current) return;
    onChange(editorRef.current?.innerHTML ?? "");
  }, [onChange]);

  function exec(cmd: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function handleLink() {
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      exec(e.shiftKey ? "outdent" : "indent");
    }
  }

  return (
    <div className="rte-wrapper">
      {/* Toolbar */}
      <div className="rte-toolbar">
        {TOOLS.map((group, gi) => (
          <div key={gi} className="rte-toolbar__group">
            {group.map((t) => (
              <button
                key={t.cmd + (t.arg ?? "")}
                type="button"
                title={t.title}
                className="rte-toolbar__btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  exec(t.cmd, t.arg);
                }}
                dangerouslySetInnerHTML={{ __html: t.icon }}
              />
            ))}
          </div>
        ))}

        {/* Link button (needs prompt) */}
        <div className="rte-toolbar__group">
          <button
            type="button"
            title="Insert link"
            className="rte-toolbar__btn"
            onMouseDown={(e) => { e.preventDefault(); handleLink(); }}
          >
            🔗
          </button>
          <button
            type="button"
            title="Remove link"
            className="rte-toolbar__btn"
            onMouseDown={(e) => { e.preventDefault(); exec("unlink"); }}
          >
            ⛓‍💥
          </button>
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="rte-body"
        style={{ minHeight }}
        data-placeholder={placeholder ?? "Start typing…"}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
