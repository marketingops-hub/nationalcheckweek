import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createStaticClient } from "@/lib/supabase/server";
import { SEVERITY, SEVERITY_ICON } from "@/lib/colors";
import VoteFeedback from "@/components/VoteFeedback";
import VoiceBlock, { VOICE_DEFAULTS, type VoiceBlockData } from "@/components/VoiceBlock";
import InfoNote from "@/components/InfoNote";
import PreventionBridge from "@/components/PreventionBridge";
import CitedText from "@/components/CitedText";
import PrevNextNav from "@/components/PrevNextNav";
import { adminClient } from "@/lib/adminClient";

interface DbSource {
  id: string; num: number; title: string; url: string;
  publisher: string; year: string; verified: boolean;
}

export async function generateStaticParams() {
  const sb = createStaticClient();
  if (!sb) return [];
  const { data } = await sb.from("issues").select("slug").order("rank");
  return (data ?? []).map((i) => ({ slug: i.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sb = createStaticClient();
  if (!sb) return { title: "Wellbeing Issue" };
  const { data } = await sb
    .from("issues")
    .select("title, short_desc, seo_title, seo_desc, og_image")
    .eq("slug", slug)
    .single();
  if (!data) return { title: "Issue Not Found" };
  const title = data.seo_title ?? `${data.title} — Student Wellbeing in Australia`;
  const description =
    data.seo_desc ??
    data.short_desc ??
    `Explore Australian data, impacts, and prevention insights for ${data.title}.`;
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

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();

  // Round 1 — three independent queries in parallel
  const [{ data: issue }, { data: siblings }, { data: voiceSettings }] = await Promise.all([
    sb.from("issues").select("*").eq("slug", slug).single(),
    sb.from("issues").select("slug, icon, title, rank").order("rank"),
    adminClient()
      .from("site_settings")
      .select("key, value")
      .in("key", ["voice_heading", "voice_body", "voice_cta_text", "voice_cta_url", "voice_enabled"]),
  ]);
  if (!issue) notFound();

  // Round 2 — sources need issue.id from round 1
  const { data: dbSources } = await sb
    .from("issue_sources")
    .select("id, num, title, url, publisher, year, verified")
    .eq("issue_id", issue.id)
    .order("num");
  const issueSources: DbSource[] = dbSources ?? [];

  // Derive prev / next / total from the ordered siblings list
  const totalIssues = siblings?.length ?? 15;
  const currentIdx = siblings?.findIndex((s) => s.slug === slug) ?? -1;
  const prevIssue = currentIdx > 0 ? siblings![currentIdx - 1] : null;
  const nextIssue =
    currentIdx !== -1 && currentIdx < (siblings?.length ?? 0) - 1
      ? siblings![currentIdx + 1]
      : null;

  const voiceMap: Record<string, string> = {};
  (voiceSettings ?? []).forEach((r: { key: string; value: string }) => {
    voiceMap[r.key] = r.value;
  });
  const voiceData: Partial<VoiceBlockData> = {
    heading:  voiceMap.voice_heading  || VOICE_DEFAULTS.heading,
    body:     voiceMap.voice_body     || VOICE_DEFAULTS.body,
    cta_text: voiceMap.voice_cta_text || VOICE_DEFAULTS.cta_text,
    cta_url:  voiceMap.voice_cta_url  || VOICE_DEFAULTS.cta_url,
    enabled:  voiceMap.voice_enabled  ?? "true",
  };

  const sev = SEVERITY[issue.severity as keyof typeof SEVERITY];

  return (
    <>
      {/* HERO HEADER */}
      <div className="page-hero" style={{ borderBottomColor: sev?.color }}>
        <div className="page-hero__inner">
          <div className="page-hero__meta">
            <span className="page-hero__rank">Issue #{issue.rank} of {totalIssues}</span>
            <span className="page-hero__sep" />
            <span className="severity-badge" style={{ background: sev?.bgSolid, color: sev?.text }}>
              {SEVERITY_ICON[issue.severity as keyof typeof SEVERITY_ICON]} {sev?.label} Priority
            </span>
          </div>
          <div className="page-hero__icon">{issue.icon}</div>
          <h1 className="page-hero__title page-hero__title--detail">{issue.title}</h1>
          <p className="page-hero__subtitle page-hero__subtitle--detail">{issue.short_desc}</p>
          <div className="page-hero__anchor-stat" style={{ color: sev?.color }}>
            <p>📊 {issue.anchor_stat}</p>
          </div>
        </div>
      </div>

      {/* PREVENTION CALLOUT */}
      <InfoNote snug>
        <p>
          <strong>Why this matters for prevention:</strong> Schools cannot be expected to solve
          challenges they cannot see. When student wellbeing data is measured systematically,
          patterns like {issue.title.toLowerCase()} become visible weeks before they become a
          crisis — giving educators, counsellors and families the chance to act.
        </p>
      </InfoNote>

      {/* MAIN CONTENT */}
      <main id="main-content" className="inner-content">

        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">What Is It?</h2>
          <p className="body-text">
            <CitedText text={issue.definition} sources={issueSources} />
          </p>
        </section>

        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">What the Australian Data Shows</h2>
          <p className="body-text">
            <CitedText text={issue.australian_data} sources={issueSources} />
          </p>
        </section>

        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">How It Affects Learning &amp; Development</h2>
          <p className="body-text">
            <CitedText text={issue.mechanisms} sources={issueSources} />
          </p>
        </section>

        <section className="inner-section">
          <h2 className="section-heading section-heading--md">Key Impact Areas</h2>
          <div className="impact-grid">
            {((issue.impacts ?? []) as { title: string; text: string }[]).map((imp) => (
              <div key={imp.title} className="impact-card">
                <div className="impact-card__title" style={{ color: sev?.color }}>{imp.title}</div>
                <p className="impact-card__body">{imp.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="inner-section">
          <h2 className="section-heading section-heading--md">Groups Most at Risk</h2>
          <div className="risk-pills">
            {((issue.groups ?? []) as string[]).map((g) => (
              <span key={g} className="risk-pill">{g}</span>
            ))}
          </div>
        </section>

        <PreventionBridge
          heading="How regular wellbeing measurement changes outcomes"
          ctaText="Learn about data-led wellbeing tools ↗"
          ctaHref="https://www.lifeskillsgroup.com.au"
        >
          <p>
            When schools systematically measure student emotional readiness and wellbeing, early
            warning signals for issues like {issue.title.toLowerCase()} become visible. A student
            whose data shows declining engagement, rising anxiety scores, or social isolation can
            receive a targeted check-in — before the situation becomes a clinical emergency.
          </p>
          <p>
            This is the difference between reactive crisis response and proactive prevention.
            Data doesn&apos;t replace the human relationship between a teacher and a student —
            it makes that relationship more informed, more timely, and more effective.
          </p>
        </PreventionBridge>

        <VoteFeedback
          entitySlug={issue.slug}
          entityType="issue"
          label={`the ${issue.title.toLowerCase()} data`}
          sourcesHref="/sources"
        />

        <VoiceBlock data={voiceData} />

        {/* SOURCES */}
        <section id="sources" className="inner-section">
          <h2 className="section-heading section-heading--tight">Sources &amp; References</h2>

          {issueSources.length > 0 && (
            <div className="section-heading--md">
              {issueSources.map((src) => (
                <div key={src.id} id={`source-${src.num}`} className="source-item">
                  <span className={`source-num ${src.verified ? "source-num--verified" : ""}`}>
                    {src.num}
                  </span>
                  <div>
                    <div className="source-title">
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a>
                      ) : src.title}
                      {src.verified && <span className="source-verified">VERIFIED</span>}
                    </div>
                    <div className="source-meta">
                      {src.publisher}{src.publisher && src.year && " · "}{src.year}
                      {src.url && (
                        <a href={src.url} target="_blank" rel="noopener noreferrer">↗ View source</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!issueSources.length && (issue.sources as string[])?.length > 0 && (
            <div>
              {(issue.sources as string[]).map((s) => (
                <div key={s} className="source-legacy">📄 {s}</div>
              ))}
            </div>
          )}

          {issueSources.length === 0 && !(issue.sources as string[])?.length && (
            <p className="source-empty">Sources will be added as this content is verified.</p>
          )}
        </section>

        <PrevNextNav
          prev={prevIssue ? { href: `/issues/${prevIssue.slug}`, label: <>{prevIssue.icon} {prevIssue.title}</> } : null}
          next={nextIssue ? { href: `/issues/${nextIssue.slug}`, label: <>{nextIssue.icon} {nextIssue.title}</> } : null}
        />

        <div className="text-center mt-48">
          <Link href="/#issues" className="back-link">← Back to all issues</Link>
        </div>
      </main>
    </>
  );
}
