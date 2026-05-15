"use client";

import { type AreaIssue, type GlobalIssue, INPUT_CLS, INPUT_STYLE, LABEL_CLS, LABEL_STYLE, SEVERITY_LEFT } from "./AreaTypes";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className={LABEL_CLS} style={LABEL_STYLE}>{label}</label>{children}</div>;
}

export default function AreaIssueCard({ issue, idx, onChange, onRemove, globalIssues }: {
  issue: AreaIssue; idx: number;
  onChange: (idx: number, field: keyof AreaIssue, val: string) => void;
  onRemove: (idx: number) => void;
  globalIssues: GlobalIssue[];
}) {
  const leftColor = SEVERITY_LEFT[issue.severity] ?? SEVERITY_LEFT.notable;
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--admin-bg-deep)", border: "1px solid var(--admin-border-strong)", borderLeft: `3px solid ${leftColor}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-faint)" }}>Issue #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="admin-btn admin-btn-danger text-xs px-2.5 py-1">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Title">
          <input className={INPUT_CLS} style={INPUT_STYLE} value={issue.title} onChange={e => onChange(idx, "title", e.target.value)} placeholder="e.g. Anxiety" />
        </Field>
        <Field label="Severity">
          <select className={INPUT_CLS} style={INPUT_STYLE} value={issue.severity} onChange={e => onChange(idx, "severity", e.target.value)}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="notable">Notable</option>
          </select>
        </Field>
      </div>
      <Field label="Key Stat">
        <input className={INPUT_CLS} style={INPUT_STYLE} value={issue.stat} onChange={e => onChange(idx, "stat", e.target.value)} placeholder="e.g. 1 in 5 students" />
      </Field>
      <Field label="Description">
        <textarea rows={2} className={INPUT_CLS} style={{ ...INPUT_STYLE, resize: "vertical" }} value={issue.desc} onChange={e => onChange(idx, "desc", e.target.value)} placeholder="Brief description of this issue locally…" />
      </Field>
      <Field label="Links to Issue Page">
        <select className={INPUT_CLS} style={INPUT_STYLE} value={issue.slug ?? ""} onChange={e => onChange(idx, "slug", e.target.value)}>
          <option value="">— No link (standalone) —</option>
          {globalIssues.map(gi => (
            <option key={gi.slug} value={gi.slug}>{gi.title}</option>
          ))}
        </select>
        {issue.slug && (
          <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>
            → Will link to <code>/issues/{issue.slug}</code>
          </p>
        )}
      </Field>
      <div className="mt-2">
        <span className={`admin-badge ${issue.severity === "critical" ? "admin-badge-red" : issue.severity === "high" ? "admin-badge-yellow" : "admin-badge-green"}`}>
          {issue.severity || "notable"}
        </span>
      </div>
    </div>
  );
}
