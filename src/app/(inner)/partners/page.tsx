import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Partners — National Check-in Week",
  description: "Organisations and companies we proudly work with to improve student wellbeing.",
};

export default async function PartnersPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("Partner")
    .select("id, name, description, logoUrl, url, slug")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });

  const partners = data ?? [];

  return (
    <>
      {/* Hero */}
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">🤝 Our Network</div>
          <h1 className="page-hero__title">
            Partners
          </h1>
          <p className="page-hero__subtitle">
            Organisations and companies we proudly work with to improve student wellbeing
          </p>
        </div>
      </div>

      <main className="inner-content inner-content--wide">
        {partners.length === 0 && (
          <div className="empty-state">
            <p>Partners will appear here once added.</p>
          </div>
        )}

        {partners.length > 0 && (
          <div className="profile-grid profile-grid--wide">
            {partners.map((p) => (
              <Link key={p.id} href={`/partners/${p.slug}`} className="profile-card">
                <div className="partner-card__logo">
                  {p.logoUrl ? (
                    <Image src={p.logoUrl} alt={p.name} width={80} height={80} unoptimized />
                  ) : (
                    <span className="partner-card__logo-initials">
                      {p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </span>
                  )}
                </div>
                <h2 className="profile-card__name">{p.name}</h2>
                {p.description && <p className="profile-card__bio">{p.description}</p>}
                <span className="profile-card__cta">Learn More →</span>
              </Link>
            ))}
          </div>
        )}
      </main>

    </>
  );
}
