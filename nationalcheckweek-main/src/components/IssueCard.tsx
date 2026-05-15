import Link from "next/link";
import { Issue } from "@/lib/types";
import { SEVERITY_LABEL } from "@/lib/colors";

interface Props {
  issue: Issue;
}

export default function IssueCard({ issue }: Props) {
  return (
    <Link href={`/issues/${issue.slug}`} className="issue-card-link">
      <div className="issue-card">
        <div className={`card-severity-bar bar-${issue.severity}`} />
        <div className="card-body">
          <div className="card-rank">#{issue.rank}</div>
          <div className="card-icon">{issue.icon}</div>
          <div className="card-title">{issue.title}</div>
          <div className="card-anchor-stat">{issue.anchorStat}</div>
          <div className="card-desc">{issue.shortDesc}</div>
        </div>
        <div className="card-footer">
          <span className={`severity-chip chip-${issue.severity}`}>
            {SEVERITY_LABEL[issue.severity]}
          </span>
          <span className="card-cta">Read Deep Dive →</span>
        </div>
      </div>
    </Link>
  );
}
