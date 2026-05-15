export interface KeyStat { num: string; label: string; }
export interface AreaIssue { title: string; severity: string; stat: string; desc: string; slug?: string; }
export interface GlobalIssue { slug: string; title: string; }

export const INPUT_CLS = "w-full rounded-xl px-4 py-2.5 text-[15px] outline-none transition-all";
export const INPUT_STYLE: React.CSSProperties = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
export const LABEL_CLS = "block text-xs font-semibold mb-2 uppercase tracking-wider";
export const LABEL_STYLE: React.CSSProperties = { color: "var(--admin-text-subtle)" };

export const SEVERITY_LEFT: Record<string, string> = {
  critical: "var(--admin-danger)",
  high:     "var(--admin-warning-light)",
  notable:  "var(--admin-success)",
};
