export interface ImpactBox { title: string; text: string; }

export interface VerifyResult {
  status: "verified" | "partially_verified" | "unverified";
  confidence: "high" | "medium" | "low";
  notes: string;
  sources: { num: number; title: string; url: string; publisher: string; year: string }[];
  annotated_content: string;
}

export interface PendingVerify {
  section: string;
  sectionLabel: string;
  result: VerifyResult;
  prevContent: string;
}

export interface NewSourceState { title: string; url: string; publisher: string; year: string; }

export const INPUT_CLS = "w-full rounded-xl px-4 py-2.5 text-[15px] outline-none transition-all";
export const INPUT_STYLE: React.CSSProperties = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
export const LABEL_CLS = "block text-xs font-semibold mb-2 uppercase tracking-wider";
export const LABEL_STYLE: React.CSSProperties = { color: "var(--admin-text-subtle)" };
