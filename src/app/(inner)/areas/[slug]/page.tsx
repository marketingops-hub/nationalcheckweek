import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createStaticClient } from "@/lib/supabase/server";
import { SEVERITY } from "@/lib/colors";
import type { SeverityLevel } from "@/lib/colors";
import AreaSchoolStatsPanel from "@/components/AreaSchoolStatsPanel";

interface AreaIssue { title: string; severity: string; stat: string; desc: string; }
interface KeyStat { num: string; label: string; }

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const sb = createStaticClient();
  if (!sb) return [];
  const { data } = await sb.from("areas").select("slug");
  return (data ?? []).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("areas").select("name, state, overview, seo_title, seo_desc, og_image").eq("slug", slug).single();
  if (!data) return { title: "Area Not Found" };
  const title = data.seo_title || `${data.name}, ${data.state} — Student Wellbeing Data`;
  const description = data.seo_desc || data.overview;
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

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();

  const { data: area } = await sb.from("areas").select("*").eq("slug", slug).single();
  if (!area) notFound();

  const { data: relatedData } = await sb
    .from("areas")
    .select("slug, name, type, issues")
    .eq("state_slug", area.state_slug)
    .neq("slug", slug)
    .limit(4);
  const relatedAreas = relatedData ?? [];


  return (
    <>
      {/* Hero */}
      <div className="area-hero">
        <div className="area-breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href={`/states/${area.state_slug}`}>{area.state}</Link>
          <span>›</span>
          <span style={{ color: "#FFFFFF" }}>{area.name}</span>
        </div>

        <div className="area-tag">
          {area.type === "city" ? "City" : area.type === "lga" ? "Local Government Area" : "Region"} · {area.state}
        </div>

        <h1>{area.name}</h1>
        {/^\s*</.test(area.overview ?? "") ? (
          <div className="area-hero-sub" dangerouslySetInnerHTML={{ __html: area.overview }} />
        ) : (
          <p className="area-hero-sub">{area.overview}</p>
        )}

        <div className="area-stats-row">
          <div className="area-stat-box">
            <div className="area-stat-num">{area.population}</div>
            <div className="area-stat-label">Estimated population</div>
          </div>
          <div className="area-stat-box">
            <div className="area-stat-num">{area.schools}</div>
            <div className="area-stat-label">Approximate schools</div>
          </div>
          {((area.key_stats ?? []) as KeyStat[]).map((s, i) => (
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
            {((area.issues ?? []) as AreaIssue[]).map((issue, i) => (
              <div key={i} className={`area-issue-card ${issue.severity}`}>
                <div className="area-issue-title">{issue.title}</div>
                <div className="area-issue-stat">
                  <span className={`area-sev-badge area-sev-badge--${issue.severity}`}>
                    {SEVERITY[issue.severity as SeverityLevel]?.label ?? issue.severity}
                  </span>
                  {issue.stat}
                </div>
                <div className="area-issue-desc">{issue.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SCHOOL DATA PANEL */}
        <AreaSchoolStatsPanel areaSlug={slug} areaName={area.name} />

        {/* Prevention callout */}
        <div className="area-section">
          <h2>How Data Changes Outcomes</h2>
          <div className="area-prevention">
            <div className="area-prevention__eyebrow">Prevention Insight</div>
            {/^\s*</.test(area.prevention ?? "") ? (
              <div dangerouslySetInnerHTML={{ __html: area.prevention }} />
            ) : (
              <p>{area.prevention}</p>
            )}
            <a href="https://www.lifeskillsgroup.com.au/" target="_blank" rel="noopener noreferrer" className="area-prevention__cta">
              Explore Life Skills GO →
            </a>
          </div>
        </div>

        {/* Related areas */}
        {relatedAreas.length > 0 && (
          <div className="area-section">
            <h2>Other Areas in {area.state}</h2>
            <div className="area-related-grid">
              {(relatedAreas as { slug: string; name: string; type: string; issues: unknown[] }[]).map(a => (
                <Link key={a.slug} href={`/areas/${a.slug}`} className="area-related-card">
                  <div className="area-related-card__name">{a.name}</div>
                  <div className="area-related-card__meta">
                    {a.type === "city" ? "City" : a.type === "lga" ? "LGA" : "Region"} · {a.issues.length} issues
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back navigation */}
        <div className="area-back-row">
          <Link href={`/states/${area.state_slug}`} className="area-back-btn">
            ← Back to {area.state}
          </Link>
          <Link href="/" className="area-back-btn area-back-btn--alt">
            ← Back to Map
          </Link>
        </div>

      </div>
    </>
  );
}
