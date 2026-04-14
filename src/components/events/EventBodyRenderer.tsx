/**
 * Renders event body text with support for:
 * - Section headings (lines ending with a blank line after a short all-caps or title-case line)
 * - Numbered lists (lines starting with "1." "2." etc.)
 * - Paragraph breaks (double newlines)
 * - Plain paragraphs
 */

import { sanitizeHtml } from "@/lib/sanitize";

interface Block {
  type: "heading" | "numbered-list" | "paragraph";
  items?: string[];  // for numbered-list
  text?: string;     // for heading / paragraph
}

function parseBody(raw: string): Block[] {
  if (!raw?.trim()) return [];

  // Normalise line endings, split into logical chunks by double newline
  const chunks = raw.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const blocks: Block[] = [];

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Detect numbered list: majority of lines start with a digit + dot
    const numberedLines = lines.filter((l) => /^\d+\./.test(l));
    if (numberedLines.length >= 2 || (lines.length >= 1 && /^\d+\./.test(lines[0]))) {
      blocks.push({
        type: "numbered-list",
        items: lines.map((l) => l.replace(/^\d+\.\s*/, "").trim()),
      });
      continue;
    }

    // Single short line that looks like a section heading
    // (≤ 80 chars, doesn't end with a full stop)
    if (lines.length === 1 && lines[0].length <= 90 && !lines[0].endsWith(".")) {
      blocks.push({ type: "heading", text: lines[0] });
      continue;
    }

    // Everything else → paragraph (join lines with space)
    blocks.push({ type: "paragraph", text: lines.join(" ") });
  }

  return blocks;
}

function isHtml(s: string) {
  return /^\s*</.test(s);
}

export default function EventBodyRenderer({ content }: { content: string }) {
  if (!content?.trim()) return null;

  if (isHtml(content)) {
    return (
      <div
        className="event-body event-body--html"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  const blocks = parseBody(content);
  return (
    <div className="event-body">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h3 key={i} className="event-body__heading">
              {block.text}
            </h3>
          );
        }
        if (block.type === "numbered-list") {
          return (
            <ol key={i} className="event-body__list">
              {block.items!.map((item, j) => (
                <li key={j} className="event-body__list-item">{item}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="event-body__paragraph">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
