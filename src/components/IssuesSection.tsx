"use client";
import { useState } from "react";
import { ISSUES } from "@/lib/issues";
import IssueCard from "./IssueCard";
import IssueModal from "./IssueModal";
import { Issue } from "@/lib/types";

export default function IssuesSection() {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  function openModal(rank: number) {
    const issue = ISSUES.find((i) => i.rank === rank) ?? null;
    setActiveIssue(issue);
  }

  return (
    <>
      <section className="section" id="issues">
        <div className="section-tag">Deep Dive · 15 Priority Issues</div>
        <h2>The Issues Facing Our Students</h2>
        <p className="section-lead">
          Each card is grounded in documented Australian data. Click any card to read the full analysis — what the data shows, how it damages learning, and who is most affected.
        </p>
        <div className="issues-grid">
          {ISSUES.map((issue) => (
            <IssueCard key={issue.rank} issue={issue} onOpen={openModal} />
          ))}
        </div>
      </section>

      <IssueModal issue={activeIssue} onClose={() => setActiveIssue(null)} />
    </>
  );
}
