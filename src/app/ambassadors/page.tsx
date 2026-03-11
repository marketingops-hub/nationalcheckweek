import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import InnerNav from "@/components/InnerNav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Ambassadors — Schools Wellbeing Australia",
  description: "Meet the incredible people who champion student wellbeing across Australia.",
};

export default async function AmbassadorsPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("Ambassador")
    .select("id, name, title, bio, photoUrl, slug, linkedinUrl, websiteUrl")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });

  const ambassadors = data ?? [];

  return (
    <>
      <InnerNav backHref="/" backLabel="Home" />

      {/* Hero */}
      <div style={{ background: "var(--navy)", padding: "64px 40px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--teal-light)", background: "rgba(14,116,144,0.15)",
            border: "1px solid rgba(34,211,238,0.2)", padding: "6px 14px", borderRadius: 100, marginBottom: 20,
          }}>
            🤝 Our People
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#FFFFFF", lineHeight: 1.2, marginBottom: 16, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Ambassadors
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: 560, margin: "0 auto" }}>
            Meet the incredible people who represent and champion student wellbeing across Australia
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 40px" }}>
        {ambassadors.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontSize: "1.1rem", color: "var(--text-light)" }}>Ambassadors will appear here once added.</p>
          </div>
        )}

        {ambassadors.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {ambassadors.map((a) => (
              <Link
                key={a.id}
                href={`/ambassadors/${a.slug}`}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                  background: "var(--white)", border: "1px solid var(--border)", borderRadius: 16,
                  padding: "32px 24px", textDecoration: "none",
                  transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                }}
              >
                <div style={{
                  width: 120, height: 120, borderRadius: "50%", overflow: "hidden",
                  border: "4px solid var(--teal)", marginBottom: 16, background: "var(--gray-100)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {a.photoUrl ? (
                    <Image src={a.photoUrl} alt={a.name} width={120} height={120}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                  ) : (
                    <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--teal)" }}>
                      {a.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>{a.name}</h2>
                {a.title && <p style={{ fontSize: "0.875rem", color: "var(--teal)", fontWeight: 600, margin: "4px 0 0" }}>{a.title}</p>}
                {a.bio && (
                  <p style={{
                    fontSize: "0.9rem", color: "var(--text-mid)", lineHeight: 1.7, marginTop: 10,
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {a.bio}
                  </p>
                )}
                <span style={{ marginTop: 14, fontSize: "0.875rem", color: "var(--teal)", fontWeight: 600 }}>
                  Read More →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
