import { createClient } from "@/lib/supabase/server";
import {
  SECTOR_COLORS, SECTOR_BG,
  fmt, pct, icseaContext,
} from "@/lib/schoolUtils";

interface AreaStats {
  total_schools:      number;
  total_enrolments:   number;
  avg_icsea:          number | null;
  sector_counts:      Record<string, number> | null;
  avg_indigenous_pct: number | null;
  avg_lbote_pct:      number | null;
  avg_bottom_qtr_pct: number | null;
}

// ⚠️ LARGE TABLE: school_profiles has 10,000+ rows. NEVER use .select() with
// .limit() here — PostgREST caps at 1000 rows silently. Always use RPC.
export default async function AreaSchoolStatsPanel({ areaSlug, areaName }: { areaSlug: string; areaName: string }) {
  const sb = await createClient();
  const { data, error } = await sb.rpc("get_school_stats_for_area", { p_area_slug: areaSlug });
  if (error || !data) return null;
  const stats = data as AreaStats;
  if (!stats.total_schools) return null;

  const total        = stats.total_schools;
  const totalStudents = stats.total_enrolments;
  const avg_icsea    = stats.avg_icsea;
  const sectors      = stats.sector_counts ?? {};
  const indigenous_avg = stats.avg_indigenous_pct;
  const lbote_avg      = stats.avg_lbote_pct;
  const bottom_qtr_avg = stats.avg_bottom_qtr_pct;

  const { vsNational: icseaVsNational, color: icseaColor, label: icseaLabel } = icseaContext(avg_icsea);

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
          School Profile Data · ACARA 2025
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
          Source: ACARA National School Profile, data as at <strong>March 2025</strong>. ICSEA national average is 1000. Schools shown are matched via postcode to SA3 region.
        </p>
      </div>
    </div>
  );
}
