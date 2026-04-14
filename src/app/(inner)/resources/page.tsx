import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Resources — National Check-in Week",
  description: "Free tools, lesson plans, courses and fact sheets designed to support student wellbeing in Australian schools.",
};

export default async function ResourcesPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("Resource")
    .select("id, name, description, thumbnailUrl, url, slug, category")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });

  const resources = data ?? [];

  return (
    <>
      {/* Hero */}
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">📚 Learning Resources</div>
          <h1 className="page-hero__title">
            Resources
          </h1>
          <p className="page-hero__subtitle">
            Free tools, lesson plans, courses and fact sheets designed to support student wellbeing in Australian schools
          </p>
        </div>
      </div>

      <main className="inner-content inner-content--wide">
        {resources.length === 0 && (
          <div className="empty-state">
            <p>Resources will appear here once added.</p>
          </div>
        )}

        {resources.length > 0 && (
          <div className="profile-grid profile-grid--wide">
            {resources.map((r) => (
              <Link key={r.id} href={`/resources/${r.slug}`} className="profile-card">
                <div className="partner-card__logo">
                  {r.thumbnailUrl ? (
                    <Image src={r.thumbnailUrl} alt={r.name} width={80} height={80} unoptimized />
                  ) : (
                    <span className="partner-card__logo-initials">
                      {r.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </span>
                  )}
                </div>
                <h2 className="profile-card__name">{r.name}</h2>
                {r.category && <span className="profile-card__tag">{r.category}</span>}
                {r.description && <p className="profile-card__bio">{r.description}</p>}
                <span className="profile-card__cta">View Resource →</span>
              </Link>
            ))}
          </div>
        )}
      </main>

    </>
  );
}
