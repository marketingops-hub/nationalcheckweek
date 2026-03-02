import { notFound } from "next/navigation";
import Link from "next/link";
import { REGIONAL } from "@/lib/regional";
import { getAreasByState } from "@/lib/areas";
import InnerNav from "@/components/InnerNav";

const SLUG_TO_STATE: Record<string, string> = {
  "new-south-wales":              "New South Wales",
  "victoria":                     "Victoria",
  "queensland":                   "Queensland",
  "south-australia":              "South Australia",
  "western-australia":            "Western Australia",
  "tasmania":                     "Tasmania",
  "northern-territory":           "Northern Territory",
  "australian-capital-territory": "Australian Capital Territory",
};

const STATE_ICON: Record<string, string> = {
  "New South Wales":              "🔵",
  "Victoria":                     "🟣",
  "Queensland":                   "🔴",
  "South Australia":              "🟠",
  "Western Australia":            "🔴",
  "Tasmania":                     "🟡",
  "Northern Territory":           "🔴",
  "Australian Capital Territory": "🟢",
};

const BADGE_COLOR: Record<string, { bg: string; text: string }> = {
  "badge-critical": { bg: "#FEF2F2", text: "#B91C1C" },
  "badge-high":     { bg: "#FFFBEB", text: "#B45309" },
  "badge-notable":  { bg: "#F0FDF4", text: "#15803D" },
};

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_STATE).map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StatePage({ params }: Props) {
  const { slug } = await params;
  const stateName = SLUG_TO_STATE[slug];
  if (!stateName) notFound();

  const data = REGIONAL[stateName];
  if (!data) notFound();

  const allStates = Object.keys(SLUG_TO_STATE);
  const currentIdx = allStates.indexOf(slug);
  const prevSlug = currentIdx > 0 ? allStates[currentIdx - 1] : null;
  const nextSlug = currentIdx < allStates.length - 1 ? allStates[currentIdx + 1] : null;

  return (
    <>
      <InnerNav backHref="/#map" backLabel="All States" />

      {/* HEADER */}
      <div style={{ background: "var(--navy)", padding: "56px 40px 48px", borderBottom: "4px solid var(--accent)" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>
            Regional Wellbeing Data
          </div>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{STATE_ICON[stateName]}</div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "#FFFFFF", lineHeight: 1.15, marginBottom: "16px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            {stateName}
          </h1>
          <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
            {data.subtitle}
          </p>
        </div>
      </div>

      {/* PREVENTION NOTE */}
      <div style={{ background: "#EFF6FF", borderBottom: "1px solid #BFDBFE", padding: "20px 40px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>💡</span>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#1E40AF", lineHeight: 1.7 }}>
            <strong>Understanding regional data helps prevent harm.</strong> Each state faces a unique combination of challenges. When educators and communities understand their specific context, they can direct support to where it is needed most — before problems escalate.
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "56px 40px" }}>

        <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em", paddingBottom: "12px", borderBottom: "2px solid var(--border)" }}>
          Priority Wellbeing Issues
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--text-light)", marginBottom: "32px", lineHeight: 1.7 }}>
          The following issues are documented as the most significant wellbeing challenges for students in {stateName}, based on national and state-level Australian data.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "56px" }}>
          {data.issues.map((issue, i) => {
            const badge = BADGE_COLOR[issue.badge] ?? BADGE_COLOR["badge-notable"];
            return (
              <div key={issue.name} style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "var(--gray-50)" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-light)", minWidth: "24px" }}>#{i + 1}</span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)", flex: 1, margin: 0 }}>{issue.name}</h3>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, padding: "4px 14px", borderRadius: "100px", background: badge.bg, color: badge.text, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {issue.stat}
                  </span>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ fontSize: "0.975rem", color: "var(--text-mid)", lineHeight: 1.75, margin: 0 }}>{issue.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AREAS / CITIES */}
        {(() => {
          const areas = getAreasByState(slug);
          if (areas.length === 0) return null;
          return (
            <section style={{ marginBottom: "52px" }}>
              <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em", paddingBottom: "12px", borderBottom: "2px solid var(--border)" }}>
                Cities &amp; Regions in {stateName}
              </h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-light)", marginBottom: "24px", lineHeight: 1.7 }}>
                Select a city or region to explore a detailed wellbeing report for that specific area, including local data, priority issues, and prevention insights.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
                {areas.map(area => (
                  <Link
                    key={area.slug}
                    href={`/areas/${area.slug}`}
                    style={{
                      display: "block",
                      background: "#FFFFFF",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "18px 20px",
                      textDecoration: "none",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", marginBottom: "6px" }}>
                      {area.type === "city" ? "City" : area.type === "lga" ? "LGA" : "Region"}
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.975rem", marginBottom: "6px" }}>{area.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-light)", lineHeight: 1.5 }}>
                      {area.population} · {area.issues.length} priority issues
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "var(--teal)", fontWeight: 600 }}>
                      View report →
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* DATA → PREVENTION BRIDGE */}
        <section style={{ background: "linear-gradient(135deg, #0B1D35 0%, #132848 100%)", borderRadius: "16px", padding: "36px 40px", marginBottom: "52px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal-light)", marginBottom: "12px" }}>
            From Data to Prevention
          </div>
          <h3 style={{ fontSize: "1.4rem", color: "#FFFFFF", marginBottom: "16px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            The challenge schools in {stateName} face
          </h3>
          <p style={{ fontSize: "0.975rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: "16px" }}>
            Schools across {stateName} are doing their best with the resources and information they have. But wellbeing challenges like anxiety, disengagement, and self-harm are often invisible until they become urgent. Teachers and principals are not mental health specialists — and without systematic data, they are working without a map.
          </p>
          <p style={{ fontSize: "0.975rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: "28px" }}>
            When schools measure student emotional readiness to learn regularly and systematically, the warning signs become visible weeks before a crisis. That window is where prevention lives.
          </p>
          <a href="https://www.lifeskillsgroup.com.au" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--teal)", color: "#FFFFFF", fontWeight: 600, fontSize: "0.9rem", padding: "12px 22px", borderRadius: "8px", textDecoration: "none" }}>
            Explore data-led wellbeing tools ↗
          </a>
        </section>

        {/* EXPLORE OTHER STATES */}
        <section style={{ marginBottom: "52px" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--navy)", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.04em", paddingBottom: "12px", borderBottom: "2px solid var(--border)" }}>
            Explore Other States & Territories
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {Object.entries(SLUG_TO_STATE).map(([s, name]) => (
              <Link key={s} href={`/states/${s}`} style={{
                fontSize: "0.9rem", padding: "7px 16px", borderRadius: "100px", textDecoration: "none",
                background: s === slug ? "var(--navy)" : "var(--gray-50)",
                color: s === slug ? "#FFFFFF" : "var(--navy)",
                border: `1px solid ${s === slug ? "var(--navy)" : "var(--border)"}`,
                fontWeight: 600,
              }}>
                {name}
              </Link>
            ))}
          </div>
        </section>

        {/* PREV / NEXT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", paddingTop: "32px", borderTop: "1px solid var(--border)" }}>
          <div>
            {prevSlug && (
              <Link href={`/states/${prevSlug}`} style={{ display: "block", padding: "18px 20px", border: "1px solid var(--border)", borderRadius: "10px", textDecoration: "none", background: "var(--white)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: "6px" }}>← Previous</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--navy)" }}>{SLUG_TO_STATE[prevSlug]}</div>
              </Link>
            )}
          </div>
          <div>
            {nextSlug && (
              <Link href={`/states/${nextSlug}`} style={{ display: "block", padding: "18px 20px", border: "1px solid var(--border)", borderRadius: "10px", textDecoration: "none", background: "var(--white)", textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: "6px" }}>Next →</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--navy)" }}>{SLUG_TO_STATE[nextSlug]}</div>
              </Link>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/#map" style={{ fontSize: "0.9rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
            ← Back to the map
          </Link>
        </div>
      </main>

      {/* CRISIS FOOTER */}
      <div style={{ background: "#7F1D1D", padding: "20px 40px", textAlign: "center" }}>
        <p style={{ color: "#FFFFFF", fontSize: "0.9rem", margin: 0, lineHeight: 1.7 }}>
          <strong>If you or someone you know is in crisis:</strong> Lifeline 13 11 14 · Kids Helpline 1800 551 800 · Beyond Blue 1300 22 4636
        </p>
      </div>
    </>
  );
}
