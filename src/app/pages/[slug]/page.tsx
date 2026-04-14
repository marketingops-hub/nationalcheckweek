import { notFound } from "next/navigation";
import { createClient, createStaticClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { RenderBlock, type Block } from "@/components/cms/CmsPageBlocks";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("pages").select("title, meta_title, meta_desc, description, og_image").eq("slug", slug).eq("status", "published").single();
  if (!data) return { title: "Page Not Found" };
  const title = data.meta_title || data.title;
  const description = data.meta_desc || data.description;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(data.og_image ? { images: [{ url: data.og_image }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function generateStaticParams() {
  const sb = createStaticClient();
  if (!sb) return [];
  const { data } = await sb.from("pages").select("slug").eq("status", "published");
  return (data ?? []).map(p => ({ slug: p.slug }));
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
