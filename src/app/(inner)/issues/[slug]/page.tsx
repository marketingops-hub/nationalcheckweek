import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { SEVERITY, SEVERITY_ICON } from "@/lib/colors";
import React from "react";
import VoteFeedback from "@/components/VoteFeedback";
import VoiceBlock, { VOICE_DEFAULTS, type VoiceBlockData } from "@/components/VoiceBlock";
import { adminClient } from "@/lib/adminClient";

interface DbSource {
  id: string; num: number; title: string; url: string;
  publisher: string; year: string; verified: boolean;
}

/** Renders text with inline (N) markers as anchor links to #source-N */
function CitedText({ text, sources }: { text: string; sources: DbSource[] }) {
  if (!sources.length) return <>{text}</>;
  const nums = new Set(sources.map(s => s.num));
  // Match (1), (2), (3) etc.
  const parts = text.split(/(\(\d+\))/);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\((\d+)\)$/);
        if (match && nums.has(Number(match[1]))) {
          const num = match[1];
          return (
            <a key={i} href={`#source-${num}`}
              style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.8em", textDecoration: "none", verticalAlign: "super" }}
              title={`Source ${num}`}>
              ({num})
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const sb = createBrowserClient(url, key);
  const { data } = await sb.from("issues").select("slug").order("rank");
  return (data ?? []).map((i) => ({ slug: i.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();

  const { data: issue } = await sb
    .from("issues")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!issue) notFound();

  // Fetch structured sources from DB
  const { data: dbSources } = await sb
    .from("issue_sources")
    .select("id, num, title, url, publisher, year, verified")
    .eq("issue_id", issue.id)
    .order("num");
  const issueSources: DbSource[] = dbSources ?? [];

  const { data: prevData } = await sb
    .from("issues")
    .select("slug, icon, title")
    .eq("rank", issue.rank - 1)
    .single();
  const { data: nextData } = await sb
    .from("issues")
    .select("slug, icon, title")
    .eq("rank", issue.rank + 1)
    .single();

  const { data: allIssues } = await sb.from("issues").select("rank").order("rank");
  const totalIssues = allIssues?.length ?? 15;

  const prev = prevData ?? null;
  const next = nextData ?? null;

  // Fetch voice block settings via service role to bypass any RLS on site_settings
  const { data: voiceSettings } = await adminClient()
    .from("site_settings")
    .select("key, value")
    .in("key", ["voice_heading", "voice_body", "voice_cta_text", "voice_cta_url", "voice_enabled"]);
  const voiceMap: Record<string, string> = {};
  (voiceSettings ?? []).forEach((r: { key: string; value: string }) => { voiceMap[r.key] = r.value; });
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
          <h1 className="page-hero__title page-hero__title--detail">
            {issue.title}
          </h1>
          <p className="page-hero__subtitle page-hero__subtitle--detail">
            {issue.short_desc}
          </p>
          <div className="page-hero__anchor-stat" style={{ color: sev?.color }}>
            <p>📊 {issue.anchor_stat}</p>
          </div>
        </div>
      </div>

      {/* PREVENTION CALLOUT */}
      <div className="info-note info-note--snug">
        <div className="info-note__inner">
          <span className="info-note__icon">💡</span>
          <div>
            <p>
              <strong>Why this matters for prevention:</strong> Schools cannot be expected to solve challenges they cannot see. When student wellbeing data is measured systematically, patterns like {issue.title.toLowerCase()} become visible weeks before they become a crisis — giving educators, counsellors and families the chance to act.
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main id="main-content" className="inner-content">

        {/* WHAT IS IT */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">What Is It?</h2>
          <p className="body-text"><CitedText text={issue.definition} sources={issueSources} /></p>
        </section>

        {/* AUSTRALIAN DATA */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">What the Australian Data Shows</h2>
          <p className="body-text"><CitedText text={issue.australian_data} sources={issueSources} /></p>
        </section>

        {/* HOW IT AFFECTS LEARNING */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">How It Affects Learning & Development</h2>
          <p className="body-text"><CitedText text={issue.mechanisms} sources={issueSources} /></p>
        </section>

        {/* IMPACT AREAS */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--md">Key Impact Areas</h2>
          <div className="impact-grid">
            {((issue.impacts ?? []) as { title: string; text: string }[]).map((imp) => (
              <div key={imp.title} className="impact-card">
                <div className="impact-card__title" style={{ color: sev?.color }}>
                  {imp.title}
                </div>
                <p className="impact-card__body">{imp.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MOST AT RISK */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--md">Groups Most at Risk</h2>
          <div className="risk-pills">
            {((issue.groups ?? []) as string[]).map((g) => (
              <span key={g} className="risk-pill">{g}</span>
            ))}
          </div>
        </section>

        {/* DATA PREVENTION BRIDGE */}
        <section className="prevention-bridge">
          <div className="eyebrow-tag">From Data to Prevention</div>
          <h3 className="prevention-bridge__heading">
            How regular wellbeing measurement changes outcomes
          </h3>
          <div className="prevention-bridge__body">
            <p>
              When schools systematically measure student emotional readiness and wellbeing, early warning signals for issues like {issue.title.toLowerCase()} become visible. A student whose data shows declining engagement, rising anxiety scores, or social isolation can receive a targeted check-in — before the situation becomes a clinical emergency.
            </p>
            <p>
              This is the difference between reactive crisis response and proactive prevention. Data doesn&apos;t replace the human relationship between a teacher and a student — it makes that relationship more informed, more timely, and more effective.
            </p>
          </div>
          <a href="https://www.lifeskillsgroup.com.au" target="_blank" rel="noopener noreferrer" className="prevention-bridge__cta">
            Learn about data-led wellbeing tools ↗
          </a>
        </section>

        {/* VOTE FEEDBACK */}
        <VoteFeedback
          entitySlug={issue.slug}
          entityType="issue"
          label={`the ${issue.title.toLowerCase()} data`}
          sourcesHref="/sources"
        />

        {/* YOUR VOICE CTA */}
        <VoiceBlock data={voiceData} />

        {/* SOURCES */}
        <section id="sources" className="inner-section">
          <h2 className="section-heading section-heading--tight">Sources &amp; References</h2>

          {/* Structured DB sources */}
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
                      {src.url && <a href={src.url} target="_blank" rel="noopener noreferrer">↗ View source</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legacy JSONB sources fallback */}
          {(!issueSources.length && (issue.sources as string[])?.length > 0) && (
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

        {/* PREV / NEXT */}
        <div className="prev-next-nav">
          <div>
            {prev && (
              <Link href={`/issues/${prev.slug}`} className="prev-next-nav__link">
                <span className="prev-next-nav__dir">← Previous</span>
                <span className="prev-next-nav__label">{prev.icon} {prev.title}</span>
              </Link>
            )}
          </div>
          <div>
            {next && (
              <Link href={`/issues/${next.slug}`} className="prev-next-nav__link prev-next-nav__link--right">
                <span className="prev-next-nav__dir">Next →</span>
                <span className="prev-next-nav__label">{next.icon} {next.title}</span>
              </Link>
            )}
          </div>
        </div>

        {/* BACK LINK */}
        <div className="text-center mt-48">
          <Link href="/#issues" className="back-link">← Back to all issues</Link>
        </div>
      </main>

    </>
  );
}
