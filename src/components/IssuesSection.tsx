import { ISSUES } from "@/lib/issues";
import IssueCard from "./IssueCard";

export default function IssuesSection() {
  return (
    <section className="section" id="issues">
      <div className="section-inner">
        <div className="section-tag">15 Priority Issues · Australian Data</div>
        <h2>What Schools Are Navigating — Without Enough Data</h2>
        <p className="section-lead">
          Schools want to help their students. The challenge is knowing where to look, who is struggling, and what to do next. These 15 issues represent the documented wellbeing challenges facing Australian students — each one preventable with the right information at the right time.
        </p>
        <div className="issues-grid">
          {ISSUES.map((issue) => (
            <IssueCard key={issue.rank} issue={issue} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <a href="/issues" className="hero-btn-secondary" style={{ display: "inline-flex" }}>
            View all {ISSUES.length} issues →
          </a>
        </div>
      </div>
    </section>
  );
}
