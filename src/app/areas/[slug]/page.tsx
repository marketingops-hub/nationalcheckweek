import Link from "next/link";
import { notFound } from "next/navigation";
import { getAreaBySlug, getAreasByState, AREAS } from "@/lib/areas";
import InnerNav from "@/components/InnerNav";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return AREAS.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const area = getAreaBySlug(params.slug);
  if (!area) return { title: "Area Not Found" };
  return {
    title: `${area.name} Student Wellbeing Report | Schools Monitor`,
    description: area.overview,
  };
}

export default function AreaPage({ params }: Props) {
  const area = getAreaBySlug(params.slug);
  if (!area) notFound();

  const relatedAreas = getAreasByState(area.stateSlug)
    .filter(a => a.slug !== area.slug)
    .slice(0, 4);

  const severityLabel: Record<string, string> = {
    critical: "Critical",
    high: "Elevated",
    notable: "Notable",
  };

  return (
    <>
      <InnerNav backHref={`/states/${area.stateSlug}`} backLabel={area.state} />

      {/* Hero */}
      <div className="area-hero">
        <div className="area-breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href={`/states/${area.stateSlug}`}>{area.state}</Link>
          <span>›</span>
          <span style={{ color: "#FFFFFF" }}>{area.name}</span>
        </div>

        <div className="area-tag">
          {area.type === "city" ? "City" : area.type === "lga" ? "Local Government Area" : "Region"} · {area.state}
        </div>

        <h1>{area.name}</h1>
        <p className="area-hero-sub">{area.overview}</p>

        <div className="area-stats-row">
          <div className="area-stat-box">
            <div className="area-stat-num">{area.population}</div>
            <div className="area-stat-label">Estimated population</div>
          </div>
          <div className="area-stat-box">
            <div className="area-stat-num">{area.schools}</div>
            <div className="area-stat-label">Approximate schools</div>
          </div>
          {area.keyStats.map((s, i) => (
            <div key={i} className="area-stat-box">
              <div className="area-stat-num">{s.num}</div>
              <div className="area-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="area-body">

        {/* Priority Issues */}
        <div className="area-section">
          <h2>Priority Wellbeing Issues</h2>
          <div className="area-issues-list">
            {area.issues.map((issue, i) => (
              <div key={i} className={`area-issue-card ${issue.severity}`}>
                <div className="area-issue-title">{issue.title}</div>
                <div className="area-issue-stat">
                  <span style={{
                    display: "inline-block",
                    padding: "1px 8px",
                    borderRadius: "4px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    marginRight: "8px",
                    background: issue.severity === "critical" ? "#FEE2E2" : issue.severity === "high" ? "#FEF3C7" : "#DCFCE7",
                    color: issue.severity === "critical" ? "#B91C1C" : issue.severity === "high" ? "#B45309" : "#15803D",
                  }}>
                    {severityLabel[issue.severity]}
                  </span>
                  {issue.stat}
                </div>
                <div className="area-issue-desc">{issue.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Prevention callout */}
        <div className="area-section">
          <h2>How Data Changes Outcomes</h2>
          <div style={{
            background: "linear-gradient(135deg, #0B1D35 0%, #1E3A5F 100%)",
            borderRadius: "12px",
            padding: "28px 32px",
            color: "#FFFFFF",
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F97316", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
              Prevention Insight
            </div>
            <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.75, fontSize: "0.975rem" }}>
              {area.prevention}
            </p>
            <a
              href="https://www.lifeskillsgroup.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "18px",
                background: "#E05D25",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: "10px 20px",
                borderRadius: "7px",
                textDecoration: "none",
              }}
            >
              Explore Life Skills GO →
            </a>
          </div>
        </div>

        {/* Related areas */}
        {relatedAreas.length > 0 && (
          <div className="area-section">
            <h2>Other Areas in {area.state}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {relatedAreas.map(a => (
                <Link
                  key={a.slug}
                  href={`/areas/${a.slug}`}
                  style={{
                    display: "block",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    textDecoration: "none",
                    transition: "border-color 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0B1D35", fontSize: "0.9rem" }}>{a.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
                    {a.type === "city" ? "City" : a.type === "lga" ? "LGA" : "Region"} · {a.issues.length} issues
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back navigation */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
          <Link href={`/states/${area.stateSlug}`} className="area-back-btn">
            ← Back to {area.state}
          </Link>
          <Link href="/" className="area-back-btn" style={{ background: "#334155" }}>
            ← Back to Map
          </Link>
        </div>

        {/* Crisis footer */}
        <div style={{
          marginTop: "48px",
          padding: "20px 24px",
          background: "#FEF2F2",
          borderRadius: "8px",
          border: "1px solid #FECACA",
          fontSize: "0.85rem",
          color: "#7F1D1D",
        }}>
          <strong>Crisis Support:</strong> If a student is in immediate danger, call <strong>000</strong>.
          Lifeline: <strong>13 11 14</strong> · Beyond Blue: <strong>1300 22 4636</strong> · Kids Helpline: <strong>1800 55 1800</strong>
        </div>
      </div>
    </>
  );
}
