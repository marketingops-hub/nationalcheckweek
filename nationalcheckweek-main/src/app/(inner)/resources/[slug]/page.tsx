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
  const { data } = await sb.from("Resource").select("name, description").eq("slug", slug).eq("active", true).maybeSingle();
  if (!data) return { title: "Resource Not Found" };
  return {
    title: `${data.name} — Resource | National Check-in Week`,
    description: data.description ? `${data.name} — ${data.description.slice(0, 155)}` : `${data.name} — National Check-in Week Resource`,
  };
}

export default async function ResourceDetailPage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();

  const { data: resource } = await sb
    .from("Resource")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!resource) notFound();
  const r = resource;

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="detail-hero-profile">
          <div className="detail-hero-logo">
            {r.thumbnailUrl ? (
              <Image src={r.thumbnailUrl} alt={r.name} width={96} height={96} unoptimized />
            ) : (
              <span className="detail-hero-logo__initials">
                {r.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </span>
            )}
          </div>

          <h1 className="page-hero__title page-hero__title--profile">
            {r.name}
          </h1>

          {r.category && (
            <span className="badge badge--primary" style={{ marginTop: '8px' }}>
              {r.category}
            </span>
          )}

          {r.url && (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="ext-link ext-link--mt">
              Access Resource ↗
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="inner-content inner-content--narrow">
        {r.content && (
          <section>
            <div className="body-text body-text--pre" dangerouslySetInnerHTML={{ __html: r.content }} />
          </section>
        )}

        {!r.content && r.description && (
          <section>
            <p className="body-text body-text--pre">{r.description}</p>
          </section>
        )}

        <div className="text-center mt-48">
          <Link href="/resources" className="back-link">← Back to all resources</Link>
        </div>
      </main>

    </>
  );
}
