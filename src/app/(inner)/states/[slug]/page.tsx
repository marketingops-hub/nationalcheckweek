import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { SEVERITY } from "@/lib/colors";
import SchoolStatsPanel from "@/components/SchoolStatsPanel";

const BADGE_KEY: Record<string, keyof typeof SEVERITY> = {
  "badge-critical": "critical",
  "badge-high":     "high",
  "badge-notable":  "notable",
};

export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const sb = createBrowserClient(url, key);
  const { data } = await sb.from("states").select("slug");
  return (data ?? []).map((s) => ({ slug: s.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StatePage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();

  const { data: state } = await sb
    .from("states")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!state) notFound();

  const { data: allStates } = await sb
    .from("states")
    .select("slug, name")
    .order("name");
  const stateList = allStates ?? [];
  const currentIdx = stateList.findIndex((s) => s.slug === slug);
  const prevSlug = currentIdx > 0 ? stateList[currentIdx - 1].slug : null;
  const nextSlug = currentIdx < stateList.length - 1 ? stateList[currentIdx + 1].slug : null;

  const { data: areas } = await sb
    .from("areas")
    .select("slug, name, type, population, issues")
    .eq("state_slug", slug);
  const stateAreas = areas ?? [];

  const { data: dbIssues } = await sb.from("issues").select("title, slug");
  const issueSlugByTitle: Record<string, string> = {};
  for (const di of dbIssues ?? []) {
    issueSlugByTitle[di.title.toLowerCase()] = di.slug;
  }

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
      <div className="info-note">
        <div className="info-note__inner">
          <span className="info-note__icon">💡</span>
          <p>
            <strong>Understanding regional data helps prevent harm.</strong> Each state faces a unique combination of challenges. When educators and communities understand their specific context, they can direct support to where it is needed most — before problems escalate.
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main id="main-content" className="inner-content">

        <h2 className="section-heading">Priority Wellbeing Issues</h2>
        <p className="inner-lead">
          The following issues are documented as the most significant wellbeing challenges for students in {state.name}, based on national and state-level Australian data.
        </p>

        <div className="stack stack--gap-md stack--mb-lg">
          {((state.issues ?? []) as { name: string; badge: string; stat: string; desc: string; slug?: string }[]).map((issue, i) => {
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
                  {issueSlug && (
                    <span className="issue-detail-card__cta">Read deep dive →</span>
                  )}
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
                Select a city or region to explore a detailed wellbeing report for that specific area, including local data, priority issues, and prevention insights.
              </p>
              <div className="grid-auto-fill">
                {stateAreas.map((area: { slug: string; name: string; type: string; population: string; issues: unknown[] }) => (
                  <Link key={area.slug} href={`/areas/${area.slug}`} className="area-link-card">
                    <div className="area-link-card__type">
                      {area.type === "city" ? "City" : area.type === "lga" ? "LGA" : "Region"}
                    </div>
                    <div className="area-link-card__name">{area.name}</div>
                    <div className="area-link-card__meta">
                      {area.population} · {area.issues.length} priority issues
                    </div>
                    <div className="area-link-card__cta">View report →</div>
                  </Link>
                ))}
              </div>
            </section>
        )}

        {/* DATA → PREVENTION BRIDGE */}
        <section className="prevention-bridge">
          <div className="eyebrow-tag">From Data to Prevention</div>
          <h3 className="prevention-bridge__heading">
            The challenge schools in {state.name} face
          </h3>
          <div className="prevention-bridge__body">
            <p>
              Schools across {state.name} are doing their best with the resources and information they have. But wellbeing challenges like anxiety, disengagement, and self-harm are often invisible until they become urgent. Teachers and principals are not mental health specialists — and without systematic data, they are working without a map.
            </p>
            <p>
              When schools measure student emotional readiness to learn regularly and systematically, the warning signs become visible weeks before a crisis. That window is where prevention lives.
            </p>
          </div>
          <a href="https://www.lifeskillsgroup.com.au" target="_blank" rel="noopener noreferrer" className="prevention-bridge__cta">
            Explore data-led wellbeing tools ↗
          </a>
        </section>

        {/* SOURCES */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--sm">Sources & References</h2>
          <p className="inner-lead inner-lead--tight" style={{ marginBottom: "24px" }}>
            The data presented on this page is sourced from reputable Australian government and research organisations.
          </p>
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "24px",
          }}>
            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "#29B8E8", fontSize: "1.2rem", flexShrink: 0 }}>📊</span>
                <div>
                  <strong style={{ color: "#1a1a2e", fontWeight: 600 }}>Australian Bureau of Statistics (ABS)</strong>
                  <br />
                  <a 
                    href="https://www.abs.gov.au" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#29B8E8", fontSize: "0.9rem", textDecoration: "none" }}
                  >
                    www.abs.gov.au ↗
                  </a>
                </div>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "#29B8E8", fontSize: "1.2rem", flexShrink: 0 }}>🏥</span>
                <div>
                  <strong style={{ color: "#1a1a2e", fontWeight: 600 }}>Australian Institute of Health and Welfare (AIHW)</strong>
                  <br />
                  <a 
                    href="https://www.aihw.gov.au" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#29B8E8", fontSize: "0.9rem", textDecoration: "none" }}
                  >
                    www.aihw.gov.au ↗
                  </a>
                </div>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "#29B8E8", fontSize: "1.2rem", flexShrink: 0 }}>🎓</span>
                <div>
                  <strong style={{ color: "#1a1a2e", fontWeight: 600 }}>Department of Education</strong>
                  <br />
                  <a 
                    href="https://www.education.gov.au" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#29B8E8", fontSize: "0.9rem", textDecoration: "none" }}
                  >
                    www.education.gov.au ↗
                  </a>
                </div>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "#29B8E8", fontSize: "1.2rem", flexShrink: 0 }}>📚</span>
                <div>
                  <strong style={{ color: "#1a1a2e", fontWeight: 600 }}>State and Territory Education Departments</strong>
                  <br />
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Regional data from state-specific education authorities
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* EXPLORE OTHER STATES */}
        <section className="inner-section">
          <h2 className="section-heading section-heading--sm">
            Explore Other States & Territories
          </h2>
          <div className="pill-nav">
            {stateList.map((s) => (
              <Link key={s.slug} href={`/states/${s.slug}`}
                className={`pill-nav__item ${s.slug === slug ? "pill-nav__item--active" : ""}`}>
                {s.name}
              </Link>
            ))}
          </div>
        </section>

        {/* PREV / NEXT */}
        <div className="prev-next-nav">
          <div>
            {prevSlug && (
              <Link href={`/states/${prevSlug}`} className="prev-next-nav__link">
                <span className="prev-next-nav__dir">← Previous</span>
                <span className="prev-next-nav__label">{stateList.find(s => s.slug === prevSlug)?.name}</span>
              </Link>
            )}
          </div>
          <div>
            {nextSlug && (
              <Link href={`/states/${nextSlug}`} className="prev-next-nav__link prev-next-nav__link--right">
                <span className="prev-next-nav__dir">Next →</span>
                <span className="prev-next-nav__label">{stateList.find(s => s.slug === nextSlug)?.name}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="text-center mt-48">
          <Link href="/#map" className="back-link">← Back to the map</Link>
        </div>
      </main>

    </>
  );
}
