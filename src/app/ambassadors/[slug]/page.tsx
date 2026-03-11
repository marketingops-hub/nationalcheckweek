import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InnerNav from "@/components/InnerNav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Ambassador — Schools Wellbeing Australia",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AmbassadorProfilePage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();

  const { data: ambassador } = await sb
    .from("Ambassador")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!ambassador) notFound();
  const a = ambassador;

  return (
    <>
      <InnerNav backHref="/ambassadors" backLabel="All Ambassadors" />

      {/* Hero */}
      <div style={{ background: "var(--navy)", padding: "56px 40px 48px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{
            width: 160, height: 160, borderRadius: "50%", overflow: "hidden",
            border: "5px solid rgba(255,255,255,0.2)", marginBottom: 20, background: "rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {a.photoUrl ? (
              <Image src={a.photoUrl} alt={a.name} width={160} height={160}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
            ) : (
              <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--teal-light)" }}>
                {a.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#FFFFFF", lineHeight: 1.2, marginBottom: 8, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {a.name}
          </h1>
          {a.title && (
            <p style={{ fontSize: "1.05rem", color: "var(--teal-light)", fontWeight: 600, margin: "0 0 16px" }}>{a.title}</p>
          )}

          {(a.linkedinUrl || a.websiteUrl) && (
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {a.linkedinUrl && (
                <a href={a.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8, padding: "8px 16px", fontSize: "0.875rem", fontWeight: 600,
                    color: "rgba(255,255,255,0.85)", textDecoration: "none",
                  }}>
                  LinkedIn ↗
                </a>
              )}
              {a.websiteUrl && (
                <a href={a.websiteUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8, padding: "8px 16px", fontSize: "0.875rem", fontWeight: 600,
                    color: "rgba(255,255,255,0.85)", textDecoration: "none",
                  }}>
                  Website ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px 40px" }}>
        {a.bio && (
          <section>
            <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              About
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-mid)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{a.bio}</p>
          </section>
        )}

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/ambassadors" style={{ fontSize: "0.9rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
            ← Back to all ambassadors
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
