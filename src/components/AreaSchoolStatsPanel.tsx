import { createClient } from "@supabase/supabase-js";

interface SchoolRow {
  school_name:               string | null;
  school_sector:             string | null;
  school_type:               string | null;
  geolocation:               string | null;
  year_range:                string | null;
  icsea:                     number | null;
  total_enrolments:          number | null;
  indigenous_enrolments_pct: number | null;
  lbote_yes_pct:             number | null;
  bottom_sea_quarter_pct:    number | null;
}

const SECTOR_COLORS: Record<string, string> = {
  Government:  "#2563eb",
  Catholic:    "#7c3aed",
  Independent: "#0891b2",
};

const SECTOR_BG: Record<string, string> = {
  Government:  "#eff6ff",
  Catholic:    "#f5f3ff",
  Independent: "#ecfeff",
};

function fmt(n: number) {
  return n.toLocaleString("en-AU");
}

function pct(n: number | null) {
  if (n == null) return "N/A";
  return `${n.toFixed(1)}%`;
}

async function fetchAreaSchools(areaSlug: string): Promise<SchoolRow[] | null> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("school_profiles")
    .select(
      "school_name, school_sector, school_type, geolocation, year_range, icsea, " +
      "total_enrolments, indigenous_enrolments_pct, lbote_yes_pct, bottom_sea_quarter_pct"
    )
    .eq("area_slug", areaSlug)
    .order("school_name");

  if (error || !data || data.length === 0) return null;
  return data as unknown as SchoolRow[];
}

function avgPct(rows: SchoolRow[], key: keyof SchoolRow): number | null {
  const valid = rows.filter((r) => r[key] != null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((s, r) => s + (r[key] as number), 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

function countBy(rows: SchoolRow[], key: keyof SchoolRow): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = (r[key] as string | null) ?? "Unknown";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export default async function AreaSchoolStatsPanel({ areaSlug, areaName }: { areaSlug: string; areaName: string }) {
  const rows = await fetchAreaSchools(areaSlug);
  if (!rows) return null;

  const total        = rows.length;
  const totalStudents = rows.reduce((s, r) => s + (r.total_enrolments ?? 0), 0);

  const icseaRows = rows.filter((r) => r.icsea != null);
  const avg_icsea = icseaRows.length > 0
    ? Math.round(icseaRows.reduce((s, r) => s + r.icsea!, 0) / icseaRows.length)
    : null;
  const icseaVsNational = avg_icsea != null ? avg_icsea - 1000 : null;
  const icseaColor =
    avg_icsea == null        ? "#6b7280"
    : icseaVsNational! > 20  ? "#16a34a"
    : icseaVsNational! < -20 ? "#dc2626"
    : "#d97706";
  const icseaLabel =
    icseaVsNational == null  ? "national average is 1000"
    : icseaVsNational > 20   ? `${Math.abs(icseaVsNational)} pts above national avg`
    : icseaVsNational < -20  ? `${Math.abs(icseaVsNational)} pts below national avg`
    : "near national average";

  const sectors = countBy(rows, "school_sector");
  const indigenous_avg = avgPct(rows, "indigenous_enrolments_pct");
  const lbote_avg      = avgPct(rows, "lbote_yes_pct");
  const bottom_qtr_avg = avgPct(rows, "bottom_sea_quarter_pct");

  return (
    <div className="area-section" style={{ borderTop: "2px solid var(--border)", paddingTop: 32, marginTop: 8 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "#2563eb",
          background: "#eff6ff", borderRadius: 4, padding: "3px 10px", marginBottom: 10,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>school</span>
          School Profile Data · ACARA 2025
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "var(--dark)" }}>
          Schools in {areaName}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-mid)", lineHeight: 1.6 }}>
          {fmt(total)} school{total !== 1 ? "s" : ""} · {fmt(totalStudents)} students enrolled
        </p>
      </div>

      {/* ── Stat row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { icon: "school",     color: "#2563eb", label: "Schools",       value: fmt(total),         sub: "in this area" },
          { icon: "groups",     color: "#7c3aed", label: "Students",      value: fmt(totalStudents), sub: "total enrolments" },
          { icon: "equalizer",  color: icseaColor, label: "Avg ICSEA",    value: avg_icsea ?? "N/A", sub: icseaLabel },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderTop: `3px solid ${s.color}`,
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-mid)" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{String(s.value)}</div>
            <div style={{ fontSize: 11, color: "var(--text-light)", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Sector breakdown + Equity side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Sector */}
        <div style={{
          background: "var(--white)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", padding: "16px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#2563eb" }}>domain</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)" }}>By Sector</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(sectors).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
              const share = (count / total) * 100;
              const color = SECTOR_COLORS[label] ?? "#9ca3af";
              const bg    = SECTOR_BG[label]    ?? "#f9fafb";
              return (
                <div key={label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: bg, borderRadius: 6, padding: "7px 10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontSize: 13, color: "var(--text-mid)" }}>{label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${share}%`, background: color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)", minWidth: 32, textAlign: "right" }}>
                      {share.toFixed(0)}%
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-light)" }}>({count})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equity */}
        <div style={{
          background: "linear-gradient(135deg, #fff5f5 0%, #fffbeb 100%)",
          border: "1px solid #fecaca",
          borderRadius: "var(--radius-md)", padding: "16px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#dc2626" }}>diversity_3</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)" }}>Equity Indicators</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Socioeconomic disadvantage", value: pct(bottom_qtr_avg), color: "#dc2626", icon: "bar_chart", desc: "in lowest ICSEA quarter" },
              { label: "Indigenous students",         value: pct(indigenous_avg),  color: "#d97706", icon: "people",    desc: "avg across schools" },
              { label: "Language other than English", value: pct(lbote_avg),       color: "#7c3aed", icon: "translate", desc: "LBOTE avg across schools" },
            ].map((e) => (
              <div key={e.label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#fff", borderRadius: 6, padding: "8px 10px",
                borderLeft: `3px solid ${e.color}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: e.color }}>{e.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dark)" }}>{e.label}</div>
                    <div style={{ fontSize: 10, color: "var(--text-light)" }}>{e.desc}</div>
                  </div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: e.color, marginLeft: 10, flexShrink: 0 }}>{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── School list ── */}
      <div style={{
        background: "var(--white)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", overflow: "hidden",
      }}>
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 6,
          background: "#f8fafc",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#2563eb" }}>list</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)" }}>
            All {fmt(total)} Schools in {areaName}
          </span>
        </div>
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {rows.map((school, i) => {
            const color = SECTOR_COLORS[school.school_sector ?? ""] ?? "#9ca3af";
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: color, flexShrink: 0,
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {school.school_name ?? "Unknown"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-light)" }}>
                      {[school.school_sector, school.school_type, school.year_range].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  {school.icsea != null && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>{school.icsea}</div>
                      <div style={{ fontSize: 10, color: "var(--text-light)" }}>ICSEA</div>
                    </div>
                  )}
                  {school.total_enrolments != null && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>{fmt(school.total_enrolments)}</div>
                      <div style={{ fontSize: 10, color: "var(--text-light)" }}>students</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source note */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: "var(--text-light)" }}>info</span>
        <p style={{ fontSize: 11, color: "var(--text-light)", margin: 0 }}>
          Source: ACARA National School Profile 2025. ICSEA national average is 1000. Schools shown are matched via postcode to SA3 region.
        </p>
      </div>
    </div>
  );
}
