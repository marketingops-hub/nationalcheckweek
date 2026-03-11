import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InnerNav from "@/components/InnerNav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Partner — Schools Wellbeing Australia",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PartnerProfilePage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();

  const { data: partner } = await sb
    .from("Partner")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!partner) notFound();
  const p = partner;

  return (
    <>
      <InnerNav backHref="/partners" backLabel="All Partners" />

      {/* Hero */}
      <div style={{ background: "var(--navy)", padding: "56px 40px 48px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{
            width: 120, height: 120, borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.15)", marginBottom: 20, background: "rgba(255,255,255,0.95)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}>
            {p.logoUrl ? (
              <Image src={p.logoUrl} alt={p.name} width={96} height={96}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} unoptimized />
            ) : (
              <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--navy)" }}>
                {p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#FFFFFF", lineHeight: 1.2, marginBottom: 8, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {p.name}
          </h1>

          {p.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, padding: "8px 16px", fontSize: "0.875rem", fontWeight: 600,
                color: "rgba(255,255,255,0.85)", textDecoration: "none",
              }}>
              Visit Website ↗
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px 40px" }}>
        {p.description && (
          <section>
            <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              About
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-mid)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{p.description}</p>
          </section>
        )}

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/partners" style={{ fontSize: "0.9rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
            ← Back to all partners
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
