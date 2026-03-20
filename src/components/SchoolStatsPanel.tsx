import { createClient } from "@supabase/supabase-js";

interface SchoolRow {
  school_sector:             string | null;
  school_type:               string | null;
  geolocation:               string | null;
  icsea:                     number | null;
  total_enrolments:          number | null;
  indigenous_enrolments_pct: number | null;
  lbote_yes_pct:             number | null;
  bottom_sea_quarter_pct:    number | null;
}

const STATE_CODES: Record<string, string> = {
  victoria:                       "VIC",
  "new-south-wales":              "NSW",
  queensland:                     "QLD",
  "western-australia":            "WA",
  "south-australia":              "SA",
  tasmania:                       "TAS",
  "australian-capital-territory": "ACT",
  "northern-territory":           "NT",
};

const SECTOR_COLORS: Record<string, string> = {
  Government:  "#2563eb",
  Catholic:    "#7c3aed",
  Independent: "#0891b2",
};

const GEO_COLORS: Record<string, string> = {
  Metropolitan: "#16a34a",
  Provincial:   "#d97706",
  Remote:       "#dc2626",
  "Very Remote": "#7c3aed",
};

function fmt(n: number) {
  return n.toLocaleString("en-AU");
}

function pct(n: number | null) {
  if (n == null) return "N/A";
  return `${n.toFixed(1)}%`;
}

async function fetchSchoolStats(slug: string): Promise<SchoolRow[] | null> {
  const stateCode = STATE_CODES[slug];
  if (!stateCode) return null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("school_profiles")
    .select(
      "school_sector, school_type, geolocation, icsea, " +
      "total_enrolments, indigenous_enrolments_pct, lbote_yes_pct, " +
      "bottom_sea_quarter_pct"
    )
    .eq("state", stateCode);

  if (error || !data || data.length === 0) return null;
  return data as unknown as SchoolRow[];
}

function countBy(rows: SchoolRow[], key: keyof SchoolRow): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = (r[key] as string | null) ?? "Unknown";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function avgPct(rows: SchoolRow[], key: keyof SchoolRow): number | null {
  const valid = rows.filter((r) => r[key] != null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((s, r) => s + (r[key] as number), 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

interface ProportionBarProps {
  counts: Record<string, number>;
  total: number;
  colorMap: Record<string, string>;
}

function ProportionBar({ counts, total, colorMap }: ProportionBarProps) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      {/* Bar */}
      <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 2, marginBottom: 12 }}>
        {entries.map(([label, count]) => (
          <div
            key={label}
            style={{
              flex: count,
              background: colorMap[label] ?? "#9ca3af",
              minWidth: 4,
            }}
            title={`${label}: ${count} schools (${((count / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
        {entries.map(([label, count]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 2,
              background: colorMap[label] ?? "#9ca3af",
              flexShrink: 0,
              display: "inline-block",
            }} />
            <span style={{ fontSize: 12, color: "var(--text-mid)" }}>
              {label} <strong style={{ color: "var(--dark)" }}>{((count / total) * 100).toFixed(0)}%</strong>
              <span style={{ color: "var(--text-light)", marginLeft: 4 }}>({fmt(count)})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SchoolStatsPanel({ slug, stateName }: { slug: string; stateName: string }) {
  const rows = await fetchSchoolStats(slug);
  if (!rows) return null;

  const total_schools    = rows.length;
  const total_enrolments = rows.reduce((s, r) => s + (r.total_enrolments ?? 0), 0);

  const icseaRows = rows.filter((r) => r.icsea != null);
  const avg_icsea = icseaRows.length > 0
    ? Math.round(icseaRows.reduce((s, r) => s + r.icsea!, 0) / icseaRows.length)
    : null;

  const sectors     = countBy(rows, "school_sector");
  const geolocations = countBy(rows, "geolocation");

  const indigenous_avg   = avgPct(rows, "indigenous_enrolments_pct");
  const lbote_avg        = avgPct(rows, "lbote_yes_pct");
  const bottom_qtr_avg   = avgPct(rows, "bottom_sea_quarter_pct");

  // ICSEA context: national avg is 1000
  const icseaVsNational = avg_icsea != null ? avg_icsea - 1000 : null;
  const icseaLabel =
    icseaVsNational == null ? null
    : icseaVsNational > 20  ? "above national average"
    : icseaVsNational < -20 ? "below national average"
    : "near national average";

  return (
    <section className="inner-section" style={{ marginBottom: 40 }}>
      {/* Section heading */}
      <h2 className="section-heading">Schools in {stateName}</h2>
      <p className="inner-lead inner-lead--tight">
        Real data from {fmt(total_schools)} schools across {stateName}, drawn from the ACARA National School Profile 2025.
      </p>

      {/* ── Headline stats ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 28,
      }}>
        {[
          {
            value: fmt(total_schools),
            label: "Schools",
            sub: "across the state",
            icon: "school",
            color: "#2563eb",
          },
          {
            value: fmt(total_enrolments),
            label: "Students",
            sub: "total enrolments",
            icon: "groups",
            color: "#7c3aed",
          },
          {
            value: avg_icsea != null ? String(avg_icsea) : "N/A",
            label: "Avg ICSEA",
            sub: icseaLabel ?? "socio-educational advantage",
            icon: "equalizer",
            color: avg_icsea == null ? "#6b7280"
              : icseaVsNational! > 20  ? "#16a34a"
              : icseaVsNational! < -20 ? "#dc2626"
              : "#d97706",
          },
        ].map((s) => (
          <div key={s.label} className="card" style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "20px 24px",
            borderLeft: `4px solid ${s.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-mid)" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "var(--dark)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-light)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Sector + Geolocation grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

        {/* Sector */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#2563eb" }}>corporate_fare</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>School Sector</span>
          </div>
          <ProportionBar counts={sectors} total={total_schools} colorMap={SECTOR_COLORS} />
        </div>

        {/* Geolocation */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#16a34a" }}>map</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>Location Type</span>
          </div>
          <ProportionBar counts={geolocations} total={total_schools} colorMap={GEO_COLORS} />
        </div>
      </div>

      {/* ── Equity spotlight ── */}
      <div className="card-tint" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#dc2626" }}>diversity_3</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>Equity Indicators</span>
          <span style={{ fontSize: 12, color: "var(--text-light)", marginLeft: 4 }}>— average across all schools in {stateName}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            {
              value: pct(bottom_qtr_avg),
              label: "Lowest ICSEA quarter",
              desc: "Students in the most disadvantaged socio-educational quarter",
              icon: "social_leaderboard",
              color: "#dc2626",
            },
            {
              value: pct(indigenous_avg),
              label: "Indigenous students",
              desc: "Schools with higher proportions may need additional wellbeing support",
              icon: "people",
              color: "#d97706",
            },
            {
              value: pct(lbote_avg),
              label: "Language background other than English",
              desc: "Students from non-English speaking backgrounds",
              icon: "translate",
              color: "#7c3aed",
            },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "var(--white)",
              borderRadius: "var(--radius-md)",
              padding: "16px 18px",
              border: "0.5px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: stat.color }}>{stat.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-mid)" }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: 6 }}>{stat.value}</div>
              <p style={{ fontSize: 11, color: "var(--text-light)", margin: 0, lineHeight: 1.5 }}>{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Source note */}
      <p style={{ fontSize: 11, color: "var(--text-light)", marginTop: 12, marginBottom: 0 }}>
        Source: ACARA National School Profile 2025. ICSEA (Index of Community Socio-Educational Advantage) national average is 1000.
      </p>
    </section>
  );
}
