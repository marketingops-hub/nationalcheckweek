import { createClient } from "@/lib/supabase/server";
import {
  STATE_CODES, SECTOR_COLORS, GEO_COLORS,
  fmt, pct, icseaContext,
} from "@/lib/schoolUtils";

interface SchoolStats {
  total_schools:      number;
  total_enrolments:   number;
  avg_icsea:          number | null;
  sector_counts:      Record<string, number> | null;
  geo_counts:         Record<string, number> | null;
  avg_indigenous_pct: number | null;
  avg_lbote_pct:      number | null;
  avg_bottom_qtr_pct: number | null;
}

// ⚠️ LARGE TABLE: school_profiles has 10,000+ rows. NEVER use .select() with
// .limit() here — PostgREST caps at 1000 rows silently. Always use RPC.
async function fetchSchoolStats(slug: string): Promise<SchoolStats | null> {
  const stateCode = STATE_CODES[slug];
  if (!stateCode) return null;

  const sb = await createClient();
  const { data, error } = await sb.rpc("get_school_stats_for_state", { p_state_code: stateCode });

  if (error || !data) return null;
  const s = data as SchoolStats;
  if (!s.total_schools) return null;
  return s;
}

/* ── Stacked bar with row-per-segment layout ── */
function BreakdownList({ counts, total, colorMap }: { counts: Record<string, number>; total: number; colorMap: Record<string, string> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map(([label, count]) => {
        const share = (count / total) * 100;
        const color = colorMap[label] ?? "#9ca3af";
        return (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 13, color: "var(--text-mid)" }}>{label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>
                {share < 1 && count > 0 ? "<1" : share.toFixed(0)}%
                <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-light)", marginLeft: 5 }}>({fmt(count)})</span>
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${share}%`, background: color, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── ICSEA visual gauge ── */
function IcseaGauge({ value, vsNational }: { value: number; vsNational: number }) {
  // ICSEA range roughly 500–1300. Clamp position 0–100%.
  const min = 500, max = 1300;
  const pos = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const nationalPos = ((1000 - min) / (max - min)) * 100;
  const color = vsNational > 20 ? "#16a34a" : vsNational < -20 ? "#dc2626" : "#d97706";

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: "linear-gradient(to right, #fecaca, #fef9c3, #bbf7d0)", marginBottom: 20 }}>
        {/* National avg marker */}
        <div style={{
          position: "absolute", left: `${nationalPos}%`, top: -4,
          width: 2, height: 18, background: "#6b7280", borderRadius: 1,
          transform: "translateX(-50%)"
        }} />
        {/* State value marker */}
        <div style={{
          position: "absolute", left: `${pos}%`, top: -6,
          width: 12, height: 22, background: color, borderRadius: 3,
          transform: "translateX(-50%)",
          boxShadow: `0 0 0 2px white, 0 0 0 4px ${color}44`
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-light)" }}>
        <span>500 — Most disadvantaged</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, background: "#6b7280", borderRadius: 1 }} />
          <span>National avg (1000)</span>
        </div>
        <span>1300 — Most advantaged</span>
      </div>
    </div>
  );
}

export default async function SchoolStatsPanel({ slug, stateName }: { slug: string; stateName: string }) {
  const stats = await fetchSchoolStats(slug);
  if (!stats) return null;

  const { total_schools, total_enrolments, avg_icsea, avg_indigenous_pct, avg_lbote_pct, avg_bottom_qtr_pct } = stats;
  const sectors      = stats.sector_counts ?? {};
  const geolocations = stats.geo_counts    ?? {};

  const indigenous_avg   = avg_indigenous_pct;
  const lbote_avg        = avg_lbote_pct;
  const bottom_qtr_avg   = avg_bottom_qtr_pct;

  const { vsNational: icseaVsNational, color: icseaColor, label: icseaLabel } = icseaContext(avg_icsea);

  return (
    <section className="inner-section" style={{
      marginBottom: 48,
      borderTop: "2px solid var(--border)",
      paddingTop: 40,
    }}>

      {/* ── Section header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <div>
          <div className="eyebrow-tag" style={{ marginBottom: 8 }}>School Profile Data · ACARA 2025</div>
          <h2 className="section-heading" style={{ marginBottom: 6 }}>Who attends school in {stateName}?</h2>
          <p className="inner-lead inner-lead--tight" style={{ marginBottom: 0 }}>
            {fmt(total_schools)} schools · {fmt(total_enrolments)} students
          </p>
        </div>
      </div>

      {/* ── Row 1: 2 headline stats + ICSEA card ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, marginTop: 28, marginBottom: 24 }}>

        {/* Schools */}
        <div className="card" style={{ padding: "20px 22px", borderTop: "3px solid #2563eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#2563eb" }}>school</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-mid)" }}>Total Schools</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#2563eb", lineHeight: 1 }}>{fmt(total_schools)}</div>
          <div style={{ fontSize: 12, color: "var(--text-light)", marginTop: 6 }}>across {stateName}</div>
        </div>

        {/* Students */}
        <div className="card" style={{ padding: "20px 22px", borderTop: "3px solid #7c3aed" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#7c3aed" }}>groups</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-mid)" }}>Total Students</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>{fmt(total_enrolments)}</div>
          <div style={{ fontSize: 12, color: "var(--text-light)", marginTop: 6 }}>enrolled across all schools</div>
        </div>

        {/* ICSEA with gauge */}
        <div className="card" style={{ padding: "20px 22px", borderTop: `3px solid ${icseaColor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: icseaColor }}>equalizer</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-mid)" }}>Average ICSEA Score</span>
            <span style={{ fontSize: 11, color: "var(--text-light)", marginLeft: "auto" }}>Socio-educational advantage</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: icseaColor, lineHeight: 1 }}>
              {avg_icsea ?? "N/A"}
            </div>
            <div style={{ fontSize: 12, color: icseaColor, fontWeight: 600 }}>{icseaLabel}</div>
          </div>
          {avg_icsea != null && icseaVsNational != null && (
            <IcseaGauge value={avg_icsea} vsNational={icseaVsNational} />
          )}
        </div>
      </div>

      {/* ── Row 2: Sector + Location breakdowns side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        <div className="card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#2563eb" }}>domain</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>School Sector</span>
          </div>
          <BreakdownList counts={sectors} total={total_schools} colorMap={SECTOR_COLORS} />
        </div>

        <div className="card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#16a34a" }}>map</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>School Location</span>
          </div>
          <BreakdownList counts={geolocations} total={total_schools} colorMap={GEO_COLORS} />
        </div>
      </div>

      {/* ── Row 3: Equity — full width, hierarchical ── */}
      <div style={{
        background: "linear-gradient(135deg, #fff5f5 0%, #fffbeb 100%)",
        border: "1px solid #fecaca",
        borderRadius: "var(--radius-lg)",
        padding: "24px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#dc2626" }}>diversity_3</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--dark)" }}>Equity & Inclusion Indicators</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-mid)", margin: "0 0 20px", lineHeight: 1.6 }}>
          These indicators highlight student groups that research shows are at higher risk of wellbeing challenges and may require additional support. Averages are across all schools in {stateName}.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Most critical — disadvantaged quarter */}
          <div style={{
            background: "#fff",
            borderRadius: "var(--radius-md)",
            padding: "18px 20px",
            borderLeft: "4px solid #dc2626",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#dc2626" }}>bar_chart</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#dc2626" }}>Socioeconomic Disadvantage</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#dc2626", lineHeight: 1, marginBottom: 6 }}>
              {pct(bottom_qtr_avg)}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-mid)", margin: 0, lineHeight: 1.6 }}>
              of students in schools fall in the lowest quarter of socio-educational advantage nationally
            </p>
          </div>

          {/* Indigenous students */}
          <div style={{
            background: "#fff",
            borderRadius: "var(--radius-md)",
            padding: "18px 20px",
            borderLeft: "4px solid #d97706",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#d97706" }}>people</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#d97706" }}>Indigenous Students</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#d97706", lineHeight: 1, marginBottom: 6 }}>
              {pct(indigenous_avg)}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-mid)", margin: 0, lineHeight: 1.6 }}>
              average proportion of Indigenous students across schools — a group with documented higher wellbeing needs
            </p>
          </div>

          {/* LBOTE */}
          <div style={{
            background: "#fff",
            borderRadius: "var(--radius-md)",
            padding: "18px 20px",
            borderLeft: "4px solid #7c3aed",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#7c3aed" }}>translate</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7c3aed" }}>Language Background</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#7c3aed", lineHeight: 1, marginBottom: 6 }}>
              {pct(lbote_avg)}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-mid)", margin: 0, lineHeight: 1.6 }}>
              of students have a language background other than English (LBOTE) — requiring culturally aware wellbeing approaches
            </p>
          </div>
        </div>
      </div>

      {/* ── Source note ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text-light)" }}>info</span>
        <p style={{ fontSize: 11, color: "var(--text-light)", margin: 0 }}>
          Source: ACARA National School Profile, data as at <strong>March 2025</strong>. ICSEA ranges from ~500 to ~1300; national average is 1000. Equity figures are school-level averages, not student-weighted.
        </p>
      </div>
    </section>
  );
}
