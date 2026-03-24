import { createClient } from "@supabase/supabase-js";
import {
  SchoolRow, SECTOR_COLORS, SECTOR_BG,
  MAX_SCHOOL_ROWS, fmt, pct, countBy, avgPct, calcAvgIcsea, icseaContext,
} from "@/lib/schoolUtils";

async function fetchAreaSchools(areaSlug: string): Promise<SchoolRow[] | null> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("school_profiles")
    .select(
      "school_sector, school_type, geolocation, icsea, " +
      "total_enrolments, indigenous_enrolments_pct, lbote_yes_pct, bottom_sea_quarter_pct"
    )
    .eq("area_slug", areaSlug)
    .limit(MAX_SCHOOL_ROWS);

  if (error || !data || data.length === 0) return null;
  return data as unknown as SchoolRow[];
}

export default async function AreaSchoolStatsPanel({ areaSlug, areaName }: { areaSlug: string; areaName: string }) {
  const rows = await fetchAreaSchools(areaSlug);
  if (!rows) return null;

  const total        = rows.length;
  const totalStudents = rows.reduce((s, r) => s + (r.total_enrolments ?? 0), 0);

  const avg_icsea = calcAvgIcsea(rows);
  const { vsNational: icseaVsNational, color: icseaColor, label: icseaLabel } = icseaContext(avg_icsea);

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
          ACARA National School Profile 2025
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
