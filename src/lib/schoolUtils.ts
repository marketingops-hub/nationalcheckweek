export interface SchoolRow {
  school_name?:              string | null;
  school_sector:             string | null;
  school_type:               string | null;
  geolocation:               string | null;
  year_range?:               string | null;
  icsea:                     number | null;
  total_enrolments:          number | null;
  indigenous_enrolments_pct: number | null;
  lbote_yes_pct:             number | null;
  bottom_sea_quarter_pct:    number | null;
}

export const STATE_CODES: Record<string, string> = {
  victoria:                       "VIC",
  "new-south-wales":              "NSW",
  queensland:                     "QLD",
  "western-australia":            "WA",
  "south-australia":              "SA",
  tasmania:                       "TAS",
  "australian-capital-territory": "ACT",
  "northern-territory":           "NT",
};

export const SECTOR_COLORS: Record<string, string> = {
  Government:  "#2563eb",
  Catholic:    "#7c3aed",
  Independent: "#0891b2",
};

export const SECTOR_BG: Record<string, string> = {
  Government:  "#eff6ff",
  Catholic:    "#f5f3ff",
  Independent: "#ecfeff",
};

export const GEO_COLORS: Record<string, string> = {
  Metropolitan: "#16a34a",
  Provincial:   "#d97706",
  Remote:       "#dc2626",
  "Very Remote": "#991b1b",
};

/** Max rows fetched per state — prevents timeout on large states */
export const MAX_SCHOOL_ROWS = 5000;

export function fmt(n: number): string {
  return n.toLocaleString("en-AU");
}

export function pct(n: number | null): string {
  if (n == null) return "N/A";
  return `${n.toFixed(1)}%`;
}

export function countBy(rows: SchoolRow[], key: keyof SchoolRow): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = (r[key] as string | null) ?? "Unknown";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function avgPct(rows: SchoolRow[], key: keyof SchoolRow): number | null {
  const valid = rows.filter((r) => r[key] != null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((s, r) => s + (r[key] as number), 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

export function calcAvgIcsea(rows: SchoolRow[]): number | null {
  const valid = rows.filter((r) => r.icsea != null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((s, r) => s + r.icsea!, 0) / valid.length);
}

export function icseaContext(avg_icsea: number | null): {
  vsNational: number | null;
  color: string;
  label: string;
} {
  const vsNational = avg_icsea != null ? avg_icsea - 1000 : null;
  const color =
    vsNational == null  ? "#6b7280"
    : vsNational > 20   ? "#16a34a"
    : vsNational < -20  ? "#dc2626"
    : "#d97706";
  const label =
    vsNational == null       ? "Socio-educational advantage index"
    : vsNational > 20        ? `${Math.abs(vsNational)} points above national average`
    : vsNational < -20       ? `${Math.abs(vsNational)} points below national average`
    : "Near national average (1000)";
  return { vsNational, color, label };
}
