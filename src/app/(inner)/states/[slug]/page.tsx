import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createStaticClient } from "@/lib/supabase/server";
import { SEVERITY } from "@/lib/colors";
import SchoolStatsPanel from "@/components/SchoolStatsPanel";
import InfoNote from "@/components/InfoNote";
import PreventionBridge from "@/components/PreventionBridge";
import PrevNextNav from "@/components/PrevNextNav";
import { buildIssueSlugMap } from "@/lib/geo-utils";
import { parseStateIssues } from "@/lib/schemas/geo";

const BADGE_KEY: Record<string, keyof typeof SEVERITY> = {
  "badge-critical": "critical",
  "badge-high":     "high",
  "badge-notable":  "notable",
};

export async function generateStaticParams() {
  const sb = createStaticClient();
  if (!sb) return [];
  const { data } = await sb.from("states").select("slug");
  return (data ?? []).map((s) => ({ slug: s.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sb = createStaticClient();
  if (!sb) return { title: "State Wellbeing Data" };
  const { data } = await sb
    .from("states")
    .select("name, subtitle, seo_title, seo_desc, og_image")
    .eq("slug", slug)
    .single();
  if (!data) return { title: "State Not Found" };
  const title = data.seo_title ?? `${data.name} — Student Wellbeing Data`;
  const description =
    data.seo_desc ??
    data.subtitle ??
    `Explore student wellbeing priorities, data, and prevention insights for ${data.name}.`;
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

export default async function StatePage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();

  // All four queries are independent — run in parallel
  const [
    { data: state },
    { data: allStates },
    { data: areas },
    { data: dbIssues },
  ] = await Promise.all([
    sb.from("states").select("*").eq("slug", slug).single(),
    sb.from("states").select("slug, name").order("name"),
    sb.from("areas").select("slug, name, type, population, issues").eq("state_slug", slug),
    sb.from("issues").select("title, slug"),
  ]);
  if (!state) notFound();

  const stateList = allStates ?? [];
  const stateAreas = areas ?? [];
  const issueSlugByTitle = buildIssueSlugMap(dbIssues ?? []);

  const stateIssues = parseStateIssues(state.issues);

  const currentIdx = stateList.findIndex((s) => s.slug === slug);
  const prevState = currentIdx > 0 ? stateList[currentIdx - 1] : null;
  const nextState = currentIdx !== -1 && currentIdx < stateList.length - 1 ? stateList[currentIdx + 1] : null;

  return (
    <>
      {/* HEADER */}
      <div className="page-hero">
        <div className="page-hero__inner">
          <div className="eyebrow-tag">Regional Wellbeing Data</div>
          <div className="page-hero__icon">{state.icon}</div>
          <h1 className="page-hero__title">{state.name}</h1>
          <p className="page-hero__subtitle">{state.subtitle}</p>
        </div>
      </div>

      {/* PREVENTION NOTE */}
      <InfoNote>
        <p>
          <strong>Understanding regional data helps prevent harm.</strong> Each state faces a
          unique combination of challenges. When educators and communities understand their
          specific context, they can direct support to where it is needed most — before problems
          escalate.
        </p>
      </InfoNote>

      {/* MAIN */}
      <main id="main-content" className="inner-content">

        <h2 className="section-heading">Priority Wellbeing Issues</h2>
        <p className="inner-lead">
          The following issues are documented as the most significant wellbeing challenges for
          students in {state.name}, based on national and state-level Australian data.
        </p>

        <div className="stack stack--gap-md stack--mb-lg">
          {stateIssues.map((issue, i) => {
            const sevKey = BADGE_KEY[issue.badge] ?? "notable";
            const sev = SEVERITY[sevKey];
            const issueSlug = issue.slug ?? issueSlugByTitle[issue.name.toLowerCase()];
            const card = (
              <div className={`issue-detail-card${issueSlug ? " issue-detail-card--linked" : ""}`}>
                <div className="issue-detail-card__header">
                  <span className="issue-detail-card__rank">#{i + 1}</span>
                  <h3 className="issue-detail-card__title">{issue.name}</h3>
                  <span className="severity-badge" style={{ background: sev.bgSolid, color: sev.text }}>
                    {issue.stat}
                  </span>
                </div>
                <div className="issue-detail-card__body">
                  <p>{issue.desc}</p>
                  {issueSlug && <span className="issue-detail-card__cta">Read deep dive →</span>}
                </div>
              </div>
            );
            return issueSlug ? (
              <Link key={issue.name} href={`/issues/${issueSlug}`}>{card}</Link>
            ) : card;
          })}
        </div>

        {/* SCHOOL DATA PANEL */}
        <SchoolStatsPanel slug={slug} stateName={state.name} />

        {/* AREAS / CITIES */}
        {stateAreas.length > 0 && (
          <section className="inner-section">
            <h2 className="section-heading">Cities &amp; Regions in {state.name}</h2>
            <p className="inner-lead inner-lead--tight">
              Select a city or region to explore a detailed wellbeing report for that specific
              area, including local data, priority issues, and prevention insights.
            </p>
            <div className="grid-auto-fill">
              {stateAreas.map((area: { slug: string; name: string; type: string; population: string; issues: unknown[] }) => (
                <Link key={area.slug} href={`/areas/${area.slug}`} className="area-link-card">
                  <div className="area-link-card__type">
                    {area.type === "city" ? "City" : area.type === "lga" ? "LGA" : "Region"}
                  </div>
                  <div className="area-link-card__name">{area.name}</div>
                  <div className="area-link-card__meta">
                    {area.population} · {Array.isArray(area.issues) ? area.issues.length : 0} priority issues
                  </div>
                  <div className="area-link-card__cta">View report →</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <PreventionBridge
          heading={`The challenge schools in ${state.name} face`}
          ctaText="Explore data-led wellbeing tools ↗"
          ctaHref="https://www.lifeskillsgroup.com.au"
        >
          <p>
            Schools across {state.name} are doing their best with the resources and information
            they have. But wellbeing challenges like anxiety, disengagement, and self-harm are
            often invisible until they become urgent. Teachers and principals are not mental
            health specialists — and without systematic data, they are working without a map.
          </p>
          <p>
            When schools measure student emotional readiness to learn regularly and
            systematically, the warning signs become visible weeks before a crisis. That window
            is where prevention lives.
          </p>
        </PreventionBridge>

        {/* SOURCES */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--sm">Sources &amp; References</h2>
          <p className="inner-lead inner-lead--tight" style={{ marginBottom: "24px" }}>
            The data presented on this page is sourced from reputable Australian government and
            research organisations.
          </p>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { icon: "📊", name: "Australian Bureau of Statistics (ABS)", href: "https://www.abs.gov.au", domain: "www.abs.gov.au" },
                { icon: "🏥", name: "Australian Institute of Health and Welfare (AIHW)", href: "https://www.aihw.gov.au", domain: "www.aihw.gov.au" },
                { icon: "🎓", name: "Department of Education", href: "https://www.education.gov.au", domain: "www.education.gov.au" },
                { icon: "📚", name: "State and Territory Education Departments", href: null, domain: "Regional data from state-specific education authorities" },
              ].map(({ icon, name, href, domain }) => (
                <li key={name} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ color: "#29B8E8", fontSize: "1.2rem", flexShrink: 0 }}>{icon}</span>
                  <div>
                    <strong style={{ color: "#1a1a2e", fontWeight: 600 }}>{name}</strong>
                    <br />
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#29B8E8", fontSize: "0.9rem", textDecoration: "none" }}>
                        {domain} ↗
                      </a>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{domain}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* EXPLORE OTHER STATES */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--sm">Explore Other States &amp; Territories</h2>
          <div className="pill-nav">
            {stateList.map((s) => (
              <Link
                key={s.slug}
                href={`/states/${s.slug}`}
                className={`pill-nav__item ${s.slug === slug ? "pill-nav__item--active" : ""}`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>

        <PrevNextNav
          prev={prevState ? { href: `/states/${prevState.slug}`, label: prevState.name } : null}
          next={nextState ? { href: `/states/${nextState.slug}`, label: nextState.name } : null}
        />

        <div className="text-center mt-48">
          <Link href="/#map" className="back-link">← Back to the map</Link>
        </div>
      </main>
    </>
  );
}
