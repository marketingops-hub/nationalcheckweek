import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ISSUES } from "@/lib/issues";
import IssueCard from "@/components/IssueCard";
import type { Issue } from "@/lib/types";

export const metadata = {
  title: "Student Wellbeing Issues — National Check-in Week",
  description:
    "15 documented wellbeing challenges facing Australian school students — each one measurable, each one preventable with the right data.",
};

export const revalidate = 60;

function dbRowToIssue(row: Record<string, unknown>): Issue {
  return {
    rank:        row.rank as number,
    slug:        row.slug as string,
    icon:        row.icon as string,
    severity:    row.severity as Issue["severity"],
    title:       row.title as string,
    anchorStat:  row.anchor_stat as string,
    shortDesc:   row.short_desc as string,
    definition:  row.definition as string,
    australianData: row.australian_data as string,
    mechanisms:  row.mechanisms as string,
    impacts:     (row.impacts as Issue["impacts"]) ?? [],
    groups:      (row.groups as string[]) ?? [],
    sources:     (row.sources as string[]) ?? [],
  };
}

export default async function IssuesPage() {
  let issues: Issue[] = ISSUES;

  try {
    const sb = await createClient();
    const { data } = await sb
      .from("issues")
      .select("rank,slug,icon,severity,title,anchor_stat,short_desc,definition,australian_data,mechanisms,impacts,groups,sources")
      .order("rank");
    if (data && data.length > 0) {
      issues = data.map(dbRowToIssue);
    }
  } catch {
    // fall back to static data
  }

  const critical = issues.filter((i) => i.severity === "critical");
  const high     = issues.filter((i) => i.severity === "high");
  const notable  = issues.filter((i) => i.severity === "notable");

  return (
    <>
      {/* PAGE HERO */}
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner" style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="section-tag" style={{ margin: "0 auto 16px" }}>
            {issues.length} Priority Issues · Australian Data
          </div>
          <h1 className="page-hero__title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            What Schools Are Navigating
          </h1>
          <p className="page-hero__subtitle" style={{ margin: "0 auto" }}>
            These {issues.length} issues represent the documented wellbeing challenges facing Australian students.
            Each one is measurable — and each one is preventable with the right data at the right time.
          </p>
        </div>
      </div>

      <main id="main-content" className="inner-content inner-content--wide">

        {/* SEVERITY LEGEND */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
          <span className="severity-chip chip-critical">Critical Priority — {critical.length} issues</span>
          <span className="severity-chip chip-high">High Priority — {high.length} issues</span>
          <span className="severity-chip chip-notable">Notable — {notable.length} issues</span>
        </div>

        {/* CRITICAL */}
        {critical.length > 0 && (
          <section style={{ marginBottom: 52 }}>
            <h2 className="section-heading section-heading--md" style={{ borderBottomColor: "var(--red)" }}>
              🔴 Critical Priority
            </h2>
            <div className="issues-grid">
              {critical.map((issue) => (
                <IssueCard key={issue.rank} issue={issue} />
              ))}
            </div>
          </section>
        )}

        {/* HIGH */}
        {high.length > 0 && (
          <section style={{ marginBottom: 52 }}>
            <h2 className="section-heading section-heading--md" style={{ borderBottomColor: "var(--amber)" }}>
              🟡 High Priority
            </h2>
            <div className="issues-grid">
              {high.map((issue) => (
                <IssueCard key={issue.rank} issue={issue} />
              ))}
            </div>
          </section>
        )}

        {/* NOTABLE */}
        {notable.length > 0 && (
          <section style={{ marginBottom: 52 }}>
            <h2 className="section-heading section-heading--md" style={{ borderBottomColor: "var(--green)" }}>
              🟢 Notable
            </h2>
            <div className="issues-grid">
              {notable.map((issue) => (
                <IssueCard key={issue.rank} issue={issue} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="prevention-bridge">
          <div className="eyebrow-tag">From Data to Prevention</div>
          <h3 className="prevention-bridge__heading">
            These issues become visible — before they become crises
          </h3>
          <div className="prevention-bridge__body">
            <p>
              When schools systematically measure student wellbeing, early warning signals for every issue on this page
              become visible weeks before they become emergencies. National Check-in Week exists to put that data in the
              hands of school leaders.
            </p>
          </div>
          <Link href="/" className="prevention-bridge__cta">
            ← Back to home
          </Link>
        </div>

      </main>
    </>
  );
}
