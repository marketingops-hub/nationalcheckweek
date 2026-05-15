import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("Partner").select("name, description").eq("slug", slug).eq("active", true).maybeSingle();
  if (!data) return { title: "Partner Not Found" };
  return {
    title: `${data.name} — Partner | National Check-in Week`,
    description: data.description ? `${data.name} — ${data.description.slice(0, 155)}` : `${data.name} — National Check-in Week Partner`,
  };
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
      {/* Hero */}
      <div className="page-hero">
        <div className="detail-hero-profile">
          <div className="detail-hero-logo">
            {p.logoUrl ? (
              <Image src={p.logoUrl} alt={p.name} width={96} height={96} unoptimized />
            ) : (
              <span className="detail-hero-logo__initials">
                {p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </span>
            )}
          </div>

          <h1 className="page-hero__title page-hero__title--profile">
            {p.name}
          </h1>

          {p.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="ext-link ext-link--mt">
              Visit Website ↗
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      <main id="main-content" className="inner-content inner-content--narrow">
        {p.description && (
          <section>
            <h2 className="section-heading section-heading--tight">About</h2>
            <p className="body-text body-text--pre">{p.description}</p>
          </section>
        )}

        <div className="text-center mt-48">
          <Link href="/partners" className="back-link">← Back to all partners</Link>
        </div>
      </main>

    </>
  );
}
