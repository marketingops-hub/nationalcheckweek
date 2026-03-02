"use client";
import { Issue } from "@/lib/types";

interface Props {
  issue: Issue;
  onOpen: (rank: number) => void;
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: "⚠ Critical",
  high: "↑ Elevated",
  notable: "● Notable",
};

export default function IssueCard({ issue, onOpen }: Props) {
  return (
    <div className="issue-card" onClick={() => onOpen(issue.rank)}>
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
  );
}
