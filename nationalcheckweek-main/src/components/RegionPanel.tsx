"use client";
import { RegionalData } from "@/lib/types";

interface Props {
  name: string | null;
  data: RegionalData | null;
}

export default function RegionPanel({ name, data }: Props) {
  if (!name || !data) {
    return (
      <div className="region-panel">
        <div className="panel-empty">
          <div className="panel-empty-icon">🗺️</div>
          <h4>Select a Region</h4>
          <p>Click on any state or territory to view the top wellbeing issues for that region, supported by Australian data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="region-panel">
      <div className="panel-header">
        <h3>{name}</h3>
        <p>{data.subtitle}</p>
      </div>
      <div className="panel-body">
        {data.issues.map((issue) => (
          <div key={issue.name} className="panel-issue">
            <div className="panel-issue-top">
              <span className="panel-issue-name">{issue.name}</span>
              <span className={`panel-stat-badge ${issue.badge}`}>{issue.stat}</span>
            </div>
            <div className="panel-issue-desc">{issue.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
