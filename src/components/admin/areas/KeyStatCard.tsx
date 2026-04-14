"use client";

import { type KeyStat, INPUT_CLS, INPUT_STYLE, LABEL_CLS, LABEL_STYLE } from "./AreaTypes";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className={LABEL_CLS} style={LABEL_STYLE}>{label}</label>{children}</div>;
}

export default function KeyStatCard({ stat, idx, onChange, onRemove }: {
  stat: KeyStat; idx: number;
  onChange: (idx: number, field: keyof KeyStat, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-faint)" }}>Stat #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="admin-btn admin-btn-danger text-xs px-2.5 py-1">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Number / Value">
          <input className={INPUT_CLS} style={INPUT_STYLE} value={stat.num} onChange={e => onChange(idx, "num", e.target.value)} placeholder="e.g. 12,000" />
        </Field>
        <Field label="Label">
          <input className={INPUT_CLS} style={INPUT_STYLE} value={stat.label} onChange={e => onChange(idx, "label", e.target.value)} placeholder="e.g. Students enrolled" />
        </Field>
      </div>
    </div>
  );
}
