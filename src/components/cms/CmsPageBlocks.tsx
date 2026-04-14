import { sanitizeHtml } from "@/lib/sanitize";

export interface Block {
  id: string;
  type: string;
  data: Record<string, string>;
}

const CALLOUT_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  info:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8" },
  warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" },
  success: { bg: "#F0FDF4", border: "#BBF7D0", color: "#166534" },
  danger:  { bg: "#FEF2F2", border: "#FECACA", color: "#991B1B" },
};

const CTA_COLORS: Record<string, { bg: string; color: string }> = {
  primary:   { bg: "var(--primary)", color: "#FFFFFF" },
  secondary: { bg: "#E05D25",        color: "#FFFFFF" },
  outline:   { bg: "transparent",    color: "var(--primary)" },
};

export function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const level = block.data.level || "h2";
      const sizes: Record<string, string> = { h1: "2.5rem", h2: "1.75rem", h3: "1.35rem", h4: "1.1rem" };
      const Tag = level as "h1" | "h2" | "h3" | "h4";
      return (
        <Tag style={{ fontSize: sizes[level] ?? "1.75rem", fontWeight: 700, color: "var(--dark)", marginBottom: "0.75rem", lineHeight: 1.2 }}>
          {block.data.text}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p style={{ fontSize: "1rem", color: "var(--text-mid)", lineHeight: 1.8, marginBottom: "1.25rem" }}>
          {block.data.text}
        </p>
      );
    case "image":
      return (
        <figure style={{ marginBottom: "1.5rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.data.src} alt={block.data.alt} style={{ width: "100%", borderRadius: "12px", display: "block" }} />
          {block.data.caption && (
            <figcaption style={{ fontSize: "0.8rem", color: "var(--text-light)", textAlign: "center", marginTop: "8px" }}>
              {block.data.caption}
            </figcaption>
          )}
        </figure>
      );
    case "cta": {
      const c = CTA_COLORS[block.data.style] ?? CTA_COLORS.primary;
      return (
        <div style={{ marginBottom: "1.5rem" }}>
          <a href={block.data.href} style={{
            display: "inline-block",
            background: c.bg,
            color: c.color,
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "12px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            border: block.data.style === "outline" ? "2px solid var(--primary)" : "none",
          }}>
            {block.data.label}
          </a>
        </div>
      );
    }
    case "callout": {
      const c = CALLOUT_COLORS[block.data.style] ?? CALLOUT_COLORS.info;
      return (
        <div style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderLeft: `4px solid ${c.color}`,
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "1.5rem",
          color: c.color,
          fontSize: "0.95rem",
          lineHeight: 1.7,
        }}>
          {block.data.text}
        </div>
      );
    }
    case "two-col":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "1.5rem" }}>
          <div style={{ color: "var(--text-mid)", lineHeight: 1.8 }}>{block.data.left}</div>
          <div style={{ color: "var(--text-mid)", lineHeight: 1.8 }}>{block.data.right}</div>
        </div>
      );
    case "divider":
      return <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "2rem 0" }} />;
    case "html":
      return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.data.html ?? "") }} style={{ marginBottom: "1.5rem" }} />;
    default:
      return null;
  }
}
