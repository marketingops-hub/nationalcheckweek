import { notFound } from "next/navigation";
import Link from "next/link";
import InnerNav from "@/components/InnerNav";
import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import React from "react";

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

  const SEVERITY_COLOR: Record<string, string> = {
    critical: "#B91C1C",
    high: "#B45309",
    notable: "#15803D",
  };
  const SEVERITY_BG: Record<string, string> = {
    critical: "#FEF2F2",
    high: "#FFFBEB",
    notable: "#F0FDF4",
  };
  const SEVERITY_LABEL: Record<string, string> = {
    critical: "⚠ Critical Priority",
    high: "↑ Elevated Priority",
    notable: "● Notable Priority",
  };

  return (
    <>
      <InnerNav backHref="/#issues" backLabel="All Issues" />

      {/* HERO HEADER */}
      <div style={{ background: "var(--navy)", padding: "56px 40px 48px", borderBottom: `4px solid ${SEVERITY_COLOR[issue.severity]}` }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
              Issue #{issue.rank} of {totalIssues}
            </span>
            <span style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.15)" }} />
            <span style={{
              fontSize: "0.78rem", fontWeight: 700, padding: "3px 12px", borderRadius: "100px",
              background: SEVERITY_BG[issue.severity], color: SEVERITY_COLOR[issue.severity]
            }}>
              {SEVERITY_LABEL[issue.severity]}
            </span>
          </div>
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{issue.icon}</div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#FFFFFF", lineHeight: 1.2, marginBottom: "20px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            {issue.title}
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: "680px" }}>
            {issue.short_desc}
          </p>
          <div style={{ marginTop: "28px", padding: "16px 20px", background: "rgba(255,255,255,0.06)", borderLeft: `4px solid ${SEVERITY_COLOR[issue.severity]}`, borderRadius: "0 8px 8px 0" }}>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 500 }}>
              📊 {issue.anchor_stat}
            </p>
          </div>
        </div>
      </div>

      {/* PREVENTION CALLOUT */}
      <div style={{ background: "#EFF6FF", borderBottom: "1px solid #BFDBFE", padding: "24px 40px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>💡</span>
          <div>
            <p style={{ margin: 0, fontSize: "0.975rem", color: "#1E40AF", lineHeight: 1.7 }}>
              <strong>Why this matters for prevention:</strong> Schools cannot be expected to solve challenges they cannot see. When student wellbeing data is measured systematically, patterns like {issue.title.toLowerCase()} become visible weeks before they become a crisis — giving educators, counsellors and families the chance to act.
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "56px 40px" }}>

        {/* WHAT IS IT */}
        <section style={{ marginBottom: "52px" }}>
          <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            What Is It?
          </h2>
          <p style={{ fontSize: "1rem", color: "var(--text-mid)", lineHeight: 1.85 }}><CitedText text={issue.definition} sources={issueSources} /></p>
        </section>

        {/* AUSTRALIAN DATA */}
        <section style={{ marginBottom: "52px" }}>
          <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            What the Australian Data Shows
          </h2>
          <p style={{ fontSize: "1rem", color: "var(--text-mid)", lineHeight: 1.85 }}><CitedText text={issue.australian_data} sources={issueSources} /></p>
        </section>

        {/* HOW IT AFFECTS LEARNING */}
        <section style={{ marginBottom: "52px" }}>
          <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            How It Affects Learning & Development
          </h2>
          <p style={{ fontSize: "1rem", color: "var(--text-mid)", lineHeight: 1.85 }}><CitedText text={issue.mechanisms} sources={issueSources} /></p>
        </section>

        {/* IMPACT AREAS */}
        <section style={{ marginBottom: "52px" }}>
          <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: "20px", paddingBottom: "12px", borderBottom: "2px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Key Impact Areas
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {(issue.impacts as { title: string; text: string }[]).map((imp) => (
              <div key={imp.title} style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px 22px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: SEVERITY_COLOR[issue.severity], marginBottom: "8px" }}>
                  {imp.title}
                </div>
                <p style={{ fontSize: "0.95rem", color: "var(--text-mid)", lineHeight: 1.7, margin: 0 }}>{imp.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MOST AT RISK */}
        <section style={{ marginBottom: "52px" }}>
          <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: "20px", paddingBottom: "12px", borderBottom: "2px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Groups Most at Risk
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {(issue.groups as string[]).map((g) => (
              <span key={g} style={{ fontSize: "0.9rem", padding: "6px 16px", background: "rgba(11,29,53,0.06)", borderRadius: "100px", color: "var(--navy)", fontWeight: 500, border: "1px solid rgba(11,29,53,0.1)" }}>
                {g}
              </span>
            ))}
          </div>
        </section>

        {/* DATA PREVENTION BRIDGE */}
        <section style={{ marginBottom: "52px", background: "linear-gradient(135deg, #0B1D35 0%, #132848 100%)", borderRadius: "16px", padding: "36px 40px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal-light)", marginBottom: "12px" }}>
            From Data to Prevention
          </div>
          <h3 style={{ fontSize: "1.4rem", color: "#FFFFFF", marginBottom: "16px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            How regular wellbeing measurement changes outcomes
          </h3>
          <p style={{ fontSize: "0.975rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: "24px" }}>
            When schools systematically measure student emotional readiness and wellbeing, early warning signals for issues like {issue.title.toLowerCase()} become visible. A student whose data shows declining engagement, rising anxiety scores, or social isolation can receive a targeted check-in — before the situation becomes a clinical emergency.
          </p>
          <p style={{ fontSize: "0.975rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: "28px" }}>
            This is the difference between reactive crisis response and proactive prevention. Data doesn&apos;t replace the human relationship between a teacher and a student — it makes that relationship more informed, more timely, and more effective.
          </p>
          <a href="https://www.lifeskillsgroup.com.au" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--teal)", color: "#FFFFFF", fontWeight: 600, fontSize: "0.9rem", padding: "12px 22px", borderRadius: "8px", textDecoration: "none" }}>
            Learn about data-led wellbeing tools ↗
          </a>
        </section>

        {/* SOURCES */}
        <section id="sources" style={{ marginBottom: "52px" }}>
          <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Sources &amp; References
          </h2>

          {/* Structured DB sources */}
          {issueSources.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              {issueSources.map((src) => (
                <div key={src.id} id={`source-${src.num}`} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0, fontSize: "0.75rem", fontWeight: 700,
                    background: src.verified ? "#DCFCE7" : "rgba(11,29,53,0.06)",
                    color: src.verified ? "#166534" : "var(--navy)",
                  }}>
                    {src.num}
                  </span>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--navy)" }}>
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--navy)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
                          {src.title}
                        </a>
                      ) : src.title}
                      {src.verified && (
                        <span style={{ marginLeft: 8, fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#DCFCE7", color: "#166534", verticalAlign: "middle" }}>VERIFIED</span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-light)", marginTop: 2 }}>
                      {src.publisher}{src.publisher && src.year && " · "}{src.year}
                      {src.url && <span style={{ marginLeft: 8 }}><a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)", fontSize: "0.8rem" }}>↗ View source</a></span>}
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
                <div key={s} style={{ fontSize: "0.9rem", color: "var(--text-light)", padding: "10px 0", borderBottom: "1px solid var(--border)", lineHeight: 1.6 }}>
                  📄 {s}
                </div>
              ))}
            </div>
          )}

          {issueSources.length === 0 && !(issue.sources as string[])?.length && (
            <p style={{ fontSize: "0.9rem", color: "var(--text-light)", fontStyle: "italic" }}>Sources will be added as this content is verified.</p>
          )}
        </section>

        {/* PREV / NEXT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", paddingTop: "32px", borderTop: "1px solid var(--border)" }}>
          <div>
            {prev && (
              <Link href={`/issues/${prev.slug}`} style={{ display: "block", padding: "18px 20px", border: "1px solid var(--border)", borderRadius: "10px", textDecoration: "none", background: "var(--white)", transition: "border-color 0.2s" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: "6px" }}>← Previous</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--navy)" }}>{prev.icon} {prev.title}</div>
              </Link>
            )}
          </div>
          <div>
            {next && (
              <Link href={`/issues/${next.slug}`} style={{ display: "block", padding: "18px 20px", border: "1px solid var(--border)", borderRadius: "10px", textDecoration: "none", background: "var(--white)", textAlign: "right", transition: "border-color 0.2s" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: "6px" }}>Next →</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--navy)" }}>{next.icon} {next.title}</div>
              </Link>
            )}
          </div>
        </div>

        {/* BACK LINK */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/#issues" style={{ fontSize: "0.9rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
            ← Back to all issues
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
