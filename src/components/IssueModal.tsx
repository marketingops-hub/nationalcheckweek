"use client";
import { useEffect } from "react";
import { Issue } from "@/lib/types";

interface Props {
  issue: Issue | null;
  onClose: () => void;
}

export default function IssueModal({ issue, onClose }: Props) {
  useEffect(() => {
    if (!issue) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [issue, onClose]);

  if (!issue) return null;

  const severityLabel = issue.severity === "critical" ? "CRITICAL PRIORITY"
    : issue.severity === "high" ? "ELEVATED PRIORITY" : "NOTABLE CONCERN";

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-num">Issue #{issue.rank} of 15 · {severityLabel}</div>
          <h2>{issue.title}</h2>
          <div className="modal-anchor">
            <strong>Key Data Signal:</strong> {issue.anchorStat}
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <div className="msec">
            <h3>What Is It?</h3>
            <p>{issue.definition}</p>
          </div>

          <div className="msec">
            <h3>What the Australian Data Shows</h3>
            <div className="stat-pull">
              <div className="big">{issue.icon} Data</div>
              <p>{issue.australianData}</p>
            </div>
          </div>

          <div className="msec">
            <h3>How It Damages Learning &amp; Development</h3>
            <p>{issue.mechanisms}</p>
            <div className="impact-grid">
              {issue.impacts.map((imp) => (
                <div key={imp.title} className="impact-box">
                  <div className="impact-box-title">{imp.title}</div>
                  <div className="impact-box-text">{imp.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="msec">
            <h3>Who Is Most Affected?</h3>
            <div className="pills">
              {issue.groups.map((g) => (
                <div key={g} className="pill">{g}</div>
              ))}
            </div>
          </div>

          <div className="msec">
            <h3>Sources</h3>
            <div className="src-list">
              {issue.sources.map((s) => (
                <div key={s} className="src-item">↗ {s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
