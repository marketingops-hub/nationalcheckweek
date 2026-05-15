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
  const { data } = await sb.from("Ambassador").select("name, title").eq("slug", slug).eq("active", true).maybeSingle();
  if (!data) return { title: "Ambassador Not Found" };
  return {
    title: `${data.name} — Ambassador | National Check-in Week`,
    description: data.title ? `${data.name}, ${data.title} — National Check-in Week Ambassador` : `${data.name} — National Check-in Week Ambassador`,
  };
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
      {/* Hero */}
      <div className="page-hero">
        <div className="detail-hero-profile">
          <div className="detail-hero-profile__avatar">
            {a.photoUrl ? (
              <Image src={a.photoUrl} alt={a.name} width={160} height={160} unoptimized />
            ) : (
              <span className="detail-hero-profile__initials">
                {a.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </span>
            )}
          </div>

          <h1 className="page-hero__title page-hero__title--profile">
            {a.name}
          </h1>
          {a.title && <p className="detail-hero-profile__role">{a.title}</p>}

          {(a.linkedinUrl || a.websiteUrl) && (
            <div className="ext-links">
              {a.linkedinUrl && (
                <a href={a.linkedinUrl} target="_blank" rel="noopener noreferrer" className="ext-link">LinkedIn ↗</a>
              )}
              {a.websiteUrl && (
                <a href={a.websiteUrl} target="_blank" rel="noopener noreferrer" className="ext-link">Website ↗</a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <main id="main-content" className="inner-content inner-content--narrow">
        {a.bio && (
          <section>
            <h2 className="section-heading section-heading--tight">About</h2>
            <p className="body-text body-text--pre">{a.bio}</p>
          </section>
        )}

        <div className="text-center mt-48">
          <Link href="/ambassadors" className="back-link">← Back to all ambassadors</Link>
        </div>
      </main>

    </>
  );
}
