"use client";

import React, { useState } from "react";
import { type ImpactBox, INPUT_CLS, INPUT_STYLE, LABEL_CLS, LABEL_STYLE } from "./IssueTypes";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className={LABEL_CLS} style={LABEL_STYLE}>{label}</label>{children}</div>;
}

function ImpactCard({ impact, idx, onChange, onRemove }: {
  impact: ImpactBox; idx: number;
  onChange: (idx: number, field: keyof ImpactBox, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-faint)" }}>Impact #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="admin-btn admin-btn-danger text-xs px-2.5 py-1">Remove</button>
      </div>
      <Field label="Title">
        <input className={INPUT_CLS} style={INPUT_STYLE} value={impact.title} onChange={e => onChange(idx, "title", e.target.value)} placeholder="e.g. Academic Performance" />
      </Field>
      <Field label="Description">
        <textarea rows={2} className={INPUT_CLS} style={{ ...INPUT_STYLE, resize: "vertical" }} value={impact.text} onChange={e => onChange(idx, "text", e.target.value)} placeholder="How this issue impacts students…" />
      </Field>
    </div>
  );
}

function TagList({ items, onAdd, onRemove, placeholder }: {
  items: string[]; onAdd: (val: string) => void; onRemove: (idx: number) => void; placeholder: string;
}) {
  const [input, setInput] = useState("");
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault(); onAdd(input.trim()); setInput("");
    }
    if (e.key === "Backspace" && !input && items.length > 0) onRemove(items.length - 1);
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "#fff", color: "var(--admin-text-secondary)", border: "1px solid var(--admin-border)" }}>
            {item}
            <button onClick={() => onRemove(idx)} className="ml-1" style={{ color: "var(--admin-text-subtle)" }}>×</button>
          </span>
        ))}
      </div>
      <input className={INPUT_CLS} style={INPUT_STYLE} value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown} placeholder={items.length === 0 ? placeholder : "Type and press Enter…"} />
    </div>
  );
}

export default function ImpactsTab({ impacts, groups, onAddImpact, onUpdateImpact, onRemoveImpact, onAddGroup, onRemoveGroup }: {
  impacts: ImpactBox[];
  groups: string[];
  onAddImpact: () => void;
  onUpdateImpact: (idx: number, field: keyof ImpactBox, val: string) => void;
  onRemoveImpact: (idx: number) => void;
  onAddGroup: (val: string) => void;
  onRemoveGroup: (idx: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>Impact Areas</h2>
            <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>How this issue affects students</p>
          </div>
          <button onClick={onAddImpact} className="admin-btn admin-btn-primary text-xs">+ Add Impact</button>
        </div>
        {impacts.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "2px dashed var(--admin-border)" }}>
            <p className="text-xs" style={{ color: "var(--admin-text-faint)" }}>No impacts yet — click &quot;Add Impact&quot; to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {impacts.map((impact, idx) => <ImpactCard key={idx} impact={impact} idx={idx} onChange={onUpdateImpact} onRemove={onRemoveImpact} />)}
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--admin-text-primary)" }}>Groups at Risk</h2>
        <p className="text-xs mb-4" style={{ color: "var(--admin-text-subtle)" }}>Type a group name and press Enter to add</p>
        <TagList items={groups} onAdd={onAddGroup} onRemove={onRemoveGroup}
          placeholder="e.g. Indigenous students, Rural students…" />
      </div>
    </div>
  );
}
