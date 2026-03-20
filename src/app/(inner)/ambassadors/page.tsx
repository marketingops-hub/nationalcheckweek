import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

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
      {/* Hero */}
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">🤝 Our People</div>
          <h1 className="page-hero__title">
            Ambassadors
          </h1>
          <p className="page-hero__subtitle">
            Meet the incredible people who represent and champion student wellbeing across Australia
          </p>
        </div>
      </div>

      <main className="inner-content inner-content--wide">

        {/* ── CTAs ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48,
        }}>
          <Link href="/ambassadors/apply" style={{
            display: "flex", flexDirection: "column", gap: 10,
            background: "var(--primary)", borderRadius: "var(--radius-md)",
            padding: "28px 32px", textDecoration: "none",
            transition: "opacity 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#fff" }}>volunteer_activism</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Become an Ambassador</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
              Apply to join our network and champion student wellbeing in your community.
            </p>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 4 }}>Apply now →</span>
          </Link>

          <Link href="/ambassadors/nominate" style={{
            display: "flex", flexDirection: "column", gap: 10,
            background: "#fffbeb", border: "2px solid #fde68a",
            borderRadius: "var(--radius-md)", padding: "28px 32px", textDecoration: "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#d97706" }}>star</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--dark)" }}>Nominate Someone</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-mid)", lineHeight: 1.6 }}>
              Know someone making a real difference? Put them forward — nominations are always open.
            </p>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#d97706", marginTop: 4 }}>Nominate now →</span>
          </Link>
        </div>

        {ambassadors.length === 0 && (
          <div className="empty-state">
            <p>Ambassadors will appear here once added.</p>
          </div>
        )}

        {ambassadors.length > 0 && (
          <div className="profile-grid">
            {ambassadors.map((a) => (
              <Link key={a.id} href={`/ambassadors/${a.slug}`} className="profile-card">
                <div className="profile-card__avatar">
                  {a.photoUrl ? (
                    <Image src={a.photoUrl} alt={a.name} width={120} height={120} unoptimized />
                  ) : (
                    <span className="profile-card__initials">
                      {a.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </span>
                  )}
                </div>
                <h2 className="profile-card__name">{a.name}</h2>
                {a.title && <p className="profile-card__role">{a.title}</p>}
                {a.bio && <p className="profile-card__bio">{a.bio}</p>}
                <span className="profile-card__cta">Read More →</span>
              </Link>
            ))}
          </div>
        )}
      </main>

    </>
  );
}
