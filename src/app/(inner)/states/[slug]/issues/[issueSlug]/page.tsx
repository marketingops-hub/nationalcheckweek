import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createStaticClient } from "@/lib/supabase/server";
import { SEVERITY, SEVERITY_ICON } from "@/lib/colors";
import SchoolStatsPanel from "@/components/SchoolStatsPanel";
import CitedText from "@/components/CitedText";
import InfoNote from "@/components/InfoNote";
import PreventionBridge from "@/components/PreventionBridge";
import {
  parseImpacts,
  parseGroups,
  parseSourceStrings,
  parseStateIssues,
} from "@/lib/schemas/geo";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface DbSource {
  id: string; num: number; title: string; url: string;
  publisher: string; year: string; verified: boolean;
}

interface Props {
  params: Promise<{ slug: string; issueSlug: string }>;
}

/* ── Static generation ───────────────────────────────────────────────────── */

export async function generateStaticParams() {
  const sb = createStaticClient();
  if (!sb) return [];
  const [{ data: states }, { data: issues }] = await Promise.all([
    sb.from("states").select("slug"),
    sb.from("issues").select("slug"),
  ]);
  if (!states?.length || !issues?.length) return [];
  // Full cross-join: 8 states × 15 issues = 120 pages from existing data
  return states.flatMap((s) => issues.map((i) => ({ slug: s.slug, issueSlug: i.slug })));
}

/* ── Metadata ────────────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: Props) {
  const { slug, issueSlug } = await params;
  const sb = createStaticClient();
  if (!sb) return { title: "Wellbeing Data" };

  const [{ data: state }, { data: issue }] = await Promise.all([
    sb.from("states").select("name").eq("slug", slug).single(),
    sb.from("issues").select("title, short_desc").eq("slug", issueSlug).single(),
  ]);
  if (!state || !issue) return { title: "Not Found" };

  const title = `${issue.title} in ${state.name} — Student Wellbeing Data`;
  const description = `Explore ${issue.title.toLowerCase()} rates, impacts, and school prevention strategies specific to ${state.name}. ${issue.short_desc}`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function GeoIssuePage({ params }: Props) {
  const { slug: stateSlug, issueSlug } = await params;
  const sb = await createClient();

  // Round 1 — state + issue are independent
  const [{ data: state }, { data: issue }] = await Promise.all([
    sb.from("states").select("*").eq("slug", stateSlug).single(),
    sb.from("issues").select("*").eq("slug", issueSlug).single(),
  ]);
  if (!state || !issue) notFound();

  // Round 2 — sources need issue.id; related areas need stateSlug
  const [{ data: dbSources }, { data: relatedAreas }] = await Promise.all([
    sb
      .from("issue_sources")
      .select("id, num, title, url, publisher, year, verified")
      .eq("issue_id", issue.id)
      .order("num"),
    sb
      .from("areas")
      .select("slug, name, type, issues")
      .eq("state_slug", stateSlug)
      .limit(6),
  ]);
  const issueSources: DbSource[] = dbSources ?? [];

  // Find state-specific data for this issue from state.issues JSONB
  const stateIssues = parseStateIssues(state.issues);
  const stateIssueData = stateIssues.find(
    (si) => si.name.toLowerCase() === issue.title.toLowerCase()
  ) ?? null;

  const impacts = parseImpacts(issue.impacts);
  const groups = parseGroups(issue.groups);
  const legacySources = parseSourceStrings(issue.sources);
  const sev = SEVERITY[issue.severity as keyof typeof SEVERITY];

  // Areas where this issue appears in their issues JSONB
  const areasWithThisIssue = (relatedAreas ?? []).filter((area) => {
    try {
      const areaIssues = (area.issues ?? []) as { title: string }[];
      return areaIssues.some(
        (ai) => ai.title?.toLowerCase() === issue.title.toLowerCase()
      );
    } catch {
      return false;
    }
  });

  return (
    <>
      {/* HERO */}
      <div className="page-hero" style={{ borderBottomColor: sev?.color }}>
        <div className="page-hero__inner">
          {/* Breadcrumb */}
          <div className="page-hero__meta" style={{ marginBottom: "12px" }}>
            <Link href={`/states/${stateSlug}`} className="prev-next-nav__link" style={{ fontSize: "0.85rem" }}>
              ← {state.name}
            </Link>
            <span className="page-hero__sep" />
            <Link href={`/issues/${issueSlug}`} className="prev-next-nav__link" style={{ fontSize: "0.85rem" }}>
              All states →
            </Link>
          </div>
          <div className="eyebrow-tag">{state.name} · Regional Data</div>
          <div className="page-hero__icon">{issue.icon}</div>
          <h1 className="page-hero__title page-hero__title--detail">
            {issue.title} in {state.name}
          </h1>
          <p className="page-hero__subtitle page-hero__subtitle--detail">
            {issue.short_desc}
          </p>
          {/* State-specific stat if available, otherwise national */}
          <div className="page-hero__anchor-stat" style={{ color: sev?.color }}>
            <p>
              📊{" "}
              {stateIssueData?.stat
                ? `${state.name}: ${stateIssueData.stat}`
                : issue.anchor_stat}
            </p>
          </div>
          <div style={{ marginTop: "16px" }}>
            <span
              className="severity-badge"
              style={{ background: sev?.bgSolid, color: sev?.text }}
            >
              {SEVERITY_ICON[issue.severity as keyof typeof SEVERITY_ICON]} {sev?.label} Priority
            </span>
          </div>
        </div>
      </div>

      {/* STATE-SPECIFIC CALLOUT */}
      {stateIssueData && (
        <InfoNote snug>
          <p>
            <strong>{state.name} context:</strong> {stateIssueData.desc}
          </p>
        </InfoNote>
      )}

      {/* MAIN */}
      <main id="main-content" className="inner-content">

        {/* WHAT IS IT */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">What Is It?</h2>
          <p className="body-text">
            <CitedText text={issue.definition} sources={issueSources} />
          </p>
        </section>

        {/* AUSTRALIAN + STATE DATA */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">
            What the Data Shows in {state.name}
          </h2>
          {stateIssueData && (
            <div
              className="impact-card"
              style={{ borderLeft: `4px solid ${sev?.color}`, marginBottom: "20px" }}
            >
              <div className="impact-card__title" style={{ color: sev?.color }}>
                {state.name} — {stateIssueData.stat}
              </div>
              <p className="impact-card__body">{stateIssueData.desc}</p>
            </div>
          )}
          <p className="body-text">
            <CitedText text={issue.australian_data} sources={issueSources} />
          </p>
        </section>

        {/* HOW IT AFFECTS LEARNING */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--tight">
            How It Affects Learning &amp; Development
          </h2>
          <p className="body-text">
            <CitedText text={issue.mechanisms} sources={issueSources} />
          </p>
        </section>

        {/* IMPACT AREAS */}
        {impacts.length > 0 && (
          <section className="inner-section">
            <h2 className="section-heading section-heading--md">Key Impact Areas</h2>
            <div className="impact-grid">
              {impacts.map((imp) => (
                <div key={imp.title} className="impact-card">
                  <div className="impact-card__title" style={{ color: sev?.color }}>
                    {imp.title}
                  </div>
                  <p className="impact-card__body">{imp.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GROUPS MOST AT RISK */}
        {groups.length > 0 && (
          <section className="inner-section">
            <h2 className="section-heading section-heading--md">Groups Most at Risk</h2>
            <div className="risk-pills">
              {groups.map((g) => (
                <span key={g} className="risk-pill">{g}</span>
              ))}
            </div>
          </section>
        )}

        {/* SCHOOLS IN THIS STATE */}
        <SchoolStatsPanel slug={stateSlug} stateName={state.name} />

        {/* AREAS IN THIS STATE WHERE ISSUE APPEARS */}
        {areasWithThisIssue.length > 0 && (
          <section className="inner-section">
            <h2 className="section-heading section-heading--md">
              Cities &amp; Regions in {state.name} Affected
            </h2>
            <p className="inner-lead inner-lead--tight">
              The following areas within {state.name} report {issue.title.toLowerCase()} as a
              priority wellbeing concern.
            </p>
            <div className="grid-auto-fill">
              {areasWithThisIssue.map((area) => (
                <Link key={area.slug} href={`/areas/${area.slug}`} className="area-link-card">
                  <div className="area-link-card__type">
                    {area.type === "city" ? "City" : area.type === "lga" ? "LGA" : "Region"}
                  </div>
                  <div className="area-link-card__name">{area.name}</div>
                  <div className="area-link-card__cta">View area report →</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <PreventionBridge
          heading={`How schools in ${state.name} can respond to ${issue.title.toLowerCase()}`}
          ctaText="Explore data-led wellbeing tools ↗"
          ctaHref="https://www.lifeskillsgroup.com.au"
        >
          <p>
            Schools across {state.name} face {issue.title.toLowerCase()} as a documented
            wellbeing challenge, yet it often remains invisible until it becomes a crisis.
            When student wellbeing is measured systematically, patterns become visible weeks
            before they escalate — giving educators, counsellors, and families the chance to act.
          </p>
          <p>
            The difference between reactive crisis response and proactive prevention is
            timely, localised data. That window is where prevention lives.
          </p>
        </PreventionBridge>

        {/* SOURCES */}
        {(issueSources.length > 0 || legacySources.length > 0) && (
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
            {!issueSources.length && legacySources.map((s) => (
              <div key={s} className="source-legacy">📄 {s}</div>
            ))}
          </section>
        )}

        {/* NAVIGATION */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--sm">Explore More</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href={`/states/${stateSlug}`} className="prevention-bridge__cta" style={{ display: "inline-block" }}>
              ← All issues in {state.name}
            </Link>
            <Link href={`/issues/${issueSlug}`} className="prevention-bridge__cta" style={{ display: "inline-block" }}>
              {issue.title} across Australia →
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
