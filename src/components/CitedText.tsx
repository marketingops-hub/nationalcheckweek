import React from "react";

interface Source {
  num: number;
}

interface CitedTextProps {
  text: string;
  sources: Source[];
}

/**
 * Renders a text string containing inline (N) citation markers as
 * superscript anchor links that jump to the #source-N element on the page.
 * Falls back to plain text when there are no sources.
 */
export default function CitedText({ text, sources }: CitedTextProps) {
  if (!sources.length) return <>{text}</>;
  const nums = new Set(sources.map((s) => s.num));
  const parts = text.split(/(\(\d+\))/);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\((\d+)\)$/);
        if (match && nums.has(Number(match[1]))) {
          const num = match[1];
          return (
            <a
              key={i}
              href={`#source-${num}`}
              style={{
                color: "var(--teal)",
                fontWeight: 600,
                fontSize: "0.8em",
                textDecoration: "none",
                verticalAlign: "super",
              }}
              title={`Source ${num}`}
            >
              ({num})
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
