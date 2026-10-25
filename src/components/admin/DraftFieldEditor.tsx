"use client";

import type { KeyStat, StateIssueEntry } from "@/lib/pageRefresh/entities";

const input = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid var(--admin-border)",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
} as const;

const small = { fontSize: 11, color: "var(--admin-text-subtle)" } as const;

interface Props {
  field: string;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

/** Edits one field of a draft: plain text, a list of key stats, or a state's issue cards. */
export default function DraftFieldEditor({ field, value, onChange, disabled }: Props) {
  if (field === "key_stats" && Array.isArray(value)) {
    const rows = value as KeyStat[];
    const set = (i: number, patch: Partial<KeyStat>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    return (
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              aria-label={`Stat ${i + 1} figure`}
              value={r.num}
              maxLength={40}
              disabled={disabled}
              onChange={(e) => set(i, { num: e.target.value })}
              placeholder="24%"
              style={{ ...input, width: 100, flex: "none" }}
            />
            <input
              aria-label={`Stat ${i + 1} label`}
              value={r.label}
              maxLength={120}
              disabled={disabled}
              onChange={(e) => set(i, { label: e.target.value })}
              placeholder="short label"
              style={input}
            />
            <button
              type="button"
              aria-label={`Remove stat ${i + 1}`}
              disabled={disabled || rows.length <= 1}
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 16, width: "auto" }}
            >
              ×
            </button>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="admin-btn admin-btn-ghost text-xs"
            disabled={disabled || rows.length >= 6}
            onClick={() => onChange([...rows, { num: "", label: "" }])}
          >
            + Add stat
          </button>
          <span style={small}>Up to 6. Fill in or remove empty rows.</span>
        </div>
      </div>
    );
  }

  if (field === "issues" && Array.isArray(value)) {
    const cards = value as StateIssueEntry[];
    const set = (i: number, patch: Partial<StateIssueEntry>) => onChange(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)));
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {cards.map((c, i) => (
          <div key={c.name} style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 13 }}>{c.name}</strong>
            <input
              aria-label={`${c.name} headline stat`}
              value={c.stat}
              maxLength={120}
              disabled={disabled}
              onChange={(e) => set(i, { stat: e.target.value })}
              style={input}
            />
            <textarea
              aria-label={`${c.name} description`}
              value={c.desc}
              rows={3}
              maxLength={1200}
              disabled={disabled}
              onChange={(e) => set(i, { desc: e.target.value })}
              style={{ ...input, resize: "vertical" }}
            />
          </div>
        ))}
        <span style={small}>The list of issues, their order and names cannot be changed here.</span>
      </div>
    );
  }

  const text = typeof value === "string" ? value : "";
  return (
    <div>
      <textarea
        aria-label={field}
        value={text}
        rows={Math.min(14, Math.max(3, Math.ceil(text.length / 70)))}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...input, resize: "vertical", lineHeight: 1.5 }}
      />
      <div style={{ ...small, marginTop: 2 }}>{text.length} characters</div>
    </div>
  );
}
