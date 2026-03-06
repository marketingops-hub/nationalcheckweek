import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

interface Block {
  id: string;
  type: string;
  data: Record<string, string>;
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("pages").select("title, meta_title, meta_desc, description").eq("slug", slug).eq("status", "published").single();
  if (!data) return { title: "Page Not Found" };
  return {
    title: data.meta_title || data.title,
    description: data.meta_desc || data.description,
  };
}

export async function generateStaticParams() {
  const sb = await createClient();
  const { data } = await sb.from("pages").select("slug").eq("status", "published");
  return (data ?? []).map(p => ({ slug: p.slug }));
}

const CALLOUT_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  info:    { bg: "#1C2A3A", border: "#1E3A5F", color: "#58A6FF" },
  warning: { bg: "#2D1A0E", border: "#7C3404", color: "#F0883E" },
  success: { bg: "#0D2D1A", border: "#166534", color: "#6EE7B7" },
  danger:  { bg: "#3D1515", border: "#7F1D1D", color: "#F87171" },
};

const CTA_COLORS: Record<string, { bg: string; color: string }> = {
  primary:   { bg: "#1C7ED6", color: "#FFFFFF" },
  secondary: { bg: "#E05D25", color: "#FFFFFF" },
  outline:   { bg: "transparent", color: "#1C7ED6" },
};

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const level = block.data.level || "h2";
      const sizes: Record<string, string> = { h1: "2.5rem", h2: "1.75rem", h3: "1.35rem", h4: "1.1rem" };
      const Tag = level as "h1" | "h2" | "h3" | "h4";
      return (
        <Tag style={{ fontSize: sizes[level] ?? "1.75rem", fontWeight: 700, color: "#0B1D35", marginBottom: "0.75rem", lineHeight: 1.2 }}>
          {block.data.text}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p style={{ fontSize: "1rem", color: "#334155", lineHeight: 1.8, marginBottom: "1.25rem" }}>
          {block.data.text}
        </p>
      );
    case "image":
      return (
        <figure style={{ marginBottom: "1.5rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.data.src} alt={block.data.alt} style={{ width: "100%", borderRadius: "12px", display: "block" }} />
          {block.data.caption && (
            <figcaption style={{ fontSize: "0.8rem", color: "#94A3B8", textAlign: "center", marginTop: "8px" }}>
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
            border: block.data.style === "outline" ? "2px solid #1C7ED6" : "none",
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
          <div style={{ color: "#334155", lineHeight: 1.8 }}>{block.data.left}</div>
          <div style={{ color: "#334155", lineHeight: 1.8 }}>{block.data.right}</div>
        </div>
      );
    case "divider":
      return <hr style={{ border: "none", borderTop: "1px solid #E2E8F0", margin: "2rem 0" }} />;
    case "html":
      return <div dangerouslySetInnerHTML={{ __html: block.data.html ?? "" }} style={{ marginBottom: "1.5rem" }} />;
    default:
      return null;
  }
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: page } = await sb
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!page) notFound();

  const blocks = (page.content ?? []) as Block[];

  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingTop: "80px" }}>
        {/* Hero */}
        <div style={{ background: "#0B1D35", padding: "60px 24px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ color: "#FFFFFF", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, marginBottom: "16px", lineHeight: 1.15 }}>
              {page.title}
            </h1>
            {page.description && (
              <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.1rem", lineHeight: 1.7 }}>
                {page.description}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
          {blocks.map(block => (
            <RenderBlock key={block.id} block={block} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
