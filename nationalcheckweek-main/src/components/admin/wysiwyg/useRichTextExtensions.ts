"use client";

import { useMemo } from "react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

/**
 * Returns a memoized TipTap extensions array shared by all rich-text block editors.
 * Includes StarterKit (H2/H3), Link (new tab, noopener), and Placeholder.
 */
export function useRichTextExtensions(placeholder = "Click to write…") {
  return useMemo(() => [
    StarterKit.configure({ heading: { levels: [2, 3] } }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    }),
    Placeholder.configure({ placeholder }),
  ], [placeholder]);
}
