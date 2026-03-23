import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "National Check-in Week 2026 — Data Forward",
  description:
    "National Check-In Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
};

const KEY_METRICS = [
  { num: "~580K",  label: "Children aged 4–17 with diagnosable mental disorder", source: "Young Minds Matter, 2013–14" },
  { num: "72%",    label: "Lifetime mental health conditions begin before age 25", source: "Beyond Blue / AIHW" },
  { num: "8×",     label: "More cost-effective: early intervention vs crisis treatment", source: "Productivity Commission, 2020" },
  { num: "57%",    label: "Average attendance in very remote schools vs 93% city", source: "RoGS 2026" },
  { num: "1 in 5", label: "Young Australians felt lonely most or all of the time", source: "Mission Australia, 2024" },
  { num: "38%",    label: "Experienced cyberbullying in the past 12 months", source: "eSafety Commissioner, 2024" },
];

const ISSUES_TABLE = [
  { rank: 1, slug: "anxiety-depression",    icon: "😰", title: "Anxiety & Depression",              severity: "Critical", stat: "13.9% of children 4–17" },
  { rank: 2, slug: "self-harm-suicidality", icon: "🆘", title: "Self-Harm & Suicidality",           severity: "Critical", stat: "AIHW Atlas — PHN/SA3 level" },
  { rank: 3, slug: "distress-loneliness",   icon: "💔", title: "Psychological Distress & Loneliness", severity: "Critical", stat: "1 in 5 feel lonely always" },
  { rank: 4, slug: "bullying",              icon: "👊", title: "Bullying at School",                severity: "Critical", stat: "46,000+ incidents QLD 2023" },
  { rank: 5, slug: "cyberbullying",         icon: "📱", title: "Cyberbullying",                     severity: "High",     stat: "38% of young Australians" },
];

const SEVERITY_COLOR: Record<string, string> = {
  Critical: "#B91C1C",
  High:     "#B45309",
  Notable:  "#15803D",
};

export default function Home4() {
  return (
    <div style={{ background: "#f7f8fa", color: "#1e2533", fontFamily: "var(--font-body)" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />

      {/* ── Top bar ── */}
      <div style={{
        background: "#1e2533",
        borderBottom: "1px solid #2e3547",
        padding: "10px 40px",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 32 }}>
            {[
              { num: "15", label: "Documented Issues" },
              { num: "2026", label: "Program Year" },
              { num: "FREE", label: "For All Schools" },
            ].map((t) => (
              <div key={t.label} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{
                  fontSize: "0.95rem", fontWeight: 800,
                  color: "var(--primary)", fontFamily: "var(--font-display)",
                }}>{t.num}</span>
                <span style={{ fontSize: "0.72rem", color: "#7a8499", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: "0.72rem", color: "#7a8499",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Data updated · National sources
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section style={{
        background: "#1e2533",
        padding: "80px 40px 72px",
        borderBottom: "3px solid var(--primary)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{
              fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "var(--primary)", marginBottom: 20,
              fontFamily: "var(--font-body)",
            }}>
              National Check-in Week · Australia 2026
            </div>
            <h1 style={{
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 900, color: "#fff",
              fontFamily: "var(--font-display)",
              lineHeight: 1.1, letterSpacing: "-0.02em",
              marginBottom: 24,
            }}>
              Student wellbeing data<br />
              <span style={{ color: "var(--primary)" }}>for every Australian school.</span>
            </h1>
            <p style={{
              fontSize: "1.05rem", color: "#9aa5be",
              lineHeight: 1.8, maxWidth: 540, marginBottom: 36,
            }}>
              A free, evidence-based initiative giving school leaders real-time wellbeing data,
              professional learning, and early-intervention tools — before challenges become crises.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/events" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--primary)", color: "#fff",
                padding: "14px 28px", borderRadius: 6,
                fontWeight: 700, fontSize: "0.9rem",
                textDecoration: "none", fontFamily: "var(--font-body)",
              }}>
                Register Free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="/issues" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.07)", color: "#c0c8d8",
                padding: "14px 28px", borderRadius: 6,
                fontWeight: 600, fontSize: "0.9rem",
                textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)",
              }}>
                View Issue Database →
              </a>
            </div>
          </div>

          {/* Quick-ref panel */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "28px 28px",
            minWidth: 260,
          }}>
            <div style={{
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "#7a8499", marginBottom: 16,
              paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              Quick Reference
            </div>
            {[
              { label: "Program type", val: "FREE national initiative" },
              { label: "Target", val: "Australian K–12 schools" },
              { label: "Data sources", val: "AIHW, RoGS, Mission Aus." },
              { label: "Issues tracked", val: "15 documented wellbeing" },
              { label: "Webinars", val: "Expert-led, no cost" },
            ].map((r) => (
              <div key={r.label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: "0.8rem",
              }}>
                <span style={{ color: "#7a8499" }}>{r.label}</span>
                <span style={{ color: "#e2e8f0", fontWeight: 600, textAlign: "right", maxWidth: 160 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main id="main-content">

        {/* ── Key Metrics grid ── */}
        <section style={{ padding: "48px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 24, flexWrap: "wrap", gap: 8,
          }}>
            <h2 style={{
              fontSize: "0.72rem", fontWeight: 700,
              letterSpacing: "0.16em", textTransform: "uppercase",
              color: "#7a8499",
            }}>
              Key Metrics — Australian Student Wellbeing
            </h2>
            <span style={{ fontSize: "0.7rem", color: "#aab0be" }}>
              Sources: AIHW · RoGS 2026 · Mission Australia · eSafety Commissioner
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 1, background: "#e2e6ef", borderRadius: 12, overflow: "hidden",
            border: "1px solid #e2e6ef",
          }}>
            {KEY_METRICS.map((m) => (
              <div key={m.label} style={{
                background: "#fff", padding: "24px 24px",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{
                  fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                  fontWeight: 900, color: "var(--primary)",
                  fontFamily: "var(--font-display)", lineHeight: 1,
                }}>
                  {m.num}
                </div>
                <p style={{ fontSize: "0.83rem", color: "#3d4a5c", lineHeight: 1.5, margin: 0 }}>
                  {m.label}
                </p>
                <span style={{ fontSize: "0.68rem", color: "#aab0be", marginTop: 4 }}>
                  {m.source}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Issues table ── */}
        <section style={{ padding: "0 40px 56px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16, flexWrap: "wrap", gap: 8,
          }}>
            <h2 style={{
              fontSize: "0.72rem", fontWeight: 700,
              letterSpacing: "0.16em", textTransform: "uppercase",
              color: "#7a8499",
            }}>
              Issue Database — Top 5 by Severity
            </h2>
            <a href="/issues" style={{
              fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)",
              textDecoration: "none",
            }}>
              View all 15 →
            </a>
          </div>

          <div style={{
            background: "#fff", border: "1px solid #e2e6ef",
            borderRadius: 12, overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "40px 40px 1fr 160px 1fr",
              gap: 0, padding: "10px 20px",
              background: "#f7f8fa",
              borderBottom: "1px solid #e2e6ef",
              fontSize: "0.65rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em",
              color: "#9aa5be",
            }}>
              <div>#</div>
              <div />
              <div>Issue</div>
              <div>Severity</div>
              <div>Anchor Stat</div>
            </div>
            {ISSUES_TABLE.map((issue, i) => (
              <a key={issue.rank} href={`/issues/${issue.slug}`} style={{
                display: "grid",
                gridTemplateColumns: "40px 40px 1fr 160px 1fr",
                gap: 0, padding: "14px 20px",
                borderBottom: i < ISSUES_TABLE.length - 1 ? "1px solid #f0f2f7" : "none",
                textDecoration: "none", color: "inherit",
                transition: "background 0.15s",
              }}>
                <div style={{
                  fontSize: "0.75rem", fontWeight: 700,
                  color: "#aab0be", display: "flex", alignItems: "center",
                }}>
                  {issue.rank}
                </div>
                <div style={{ fontSize: "1.2rem", display: "flex", alignItems: "center" }}>
                  {issue.icon}
                </div>
                <div style={{
                  fontSize: "0.88rem", fontWeight: 700,
                  color: "#1e2533", display: "flex", alignItems: "center",
                }}>
                  {issue.title}
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 700,
                    color: SEVERITY_COLOR[issue.severity] ?? "#555",
                    background: SEVERITY_COLOR[issue.severity] ? `${SEVERITY_COLOR[issue.severity]}18` : "#f0f0f0",
                    padding: "3px 10px", borderRadius: 100,
                  }}>
                    {issue.severity}
                  </span>
                </div>
                <div style={{
                  fontSize: "0.8rem", color: "#7a8499",
                  display: "flex", alignItems: "center",
                }}>
                  {issue.stat}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── About the data ── */}
        <section style={{
          padding: "48px 40px 56px",
          background: "#fff",
          borderTop: "1px solid #e2e6ef",
          borderBottom: "1px solid #e2e6ef",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div>
              <div style={{
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#7a8499", marginBottom: 12,
              }}>
                Methodology
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1e2533", marginBottom: 12 }}>
                How This Site Uses Data
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#5a6476", lineHeight: 1.75 }}>
                A mixed-model approach: national anchors for comparability, plus region-specific
                datasets where they exist. Data gaps are disclosed, not hidden. Sources include
                AIHW, RoGS 2026, Mission Australia Youth Survey, and eSafety Commissioner.
              </p>
            </div>
            <div>
              <div style={{
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#7a8499", marginBottom: 12,
              }}>
                About the Initiative
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1e2533", marginBottom: 12 }}>
                National Check-In Week 2026
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#5a6476", lineHeight: 1.75 }}>
                A free, evidence-based initiative founded to ensure no child falls through the gaps —
                regardless of background, identity, or location. All webinars, tools, and resources
                are free for every Australian school and family.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA bar ── */}
        <section style={{
          padding: "48px 40px",
          background: "#1e2533",
        }}>
          <div style={{
            maxWidth: 1200, margin: "0 auto",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 24,
          }}>
            <div>
              <h2 style={{
                fontSize: "1.3rem", fontWeight: 800, color: "#fff",
                marginBottom: 6,
              }}>
                Register your school for free
              </h2>
              <p style={{ fontSize: "0.88rem", color: "#7a8499", margin: 0 }}>
                Free webinars · Real-time data tools · No cost to any school
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/events" style={{
                display: "inline-block",
                background: "var(--primary)", color: "#fff",
                padding: "14px 32px", borderRadius: 6,
                fontWeight: 700, fontSize: "0.9rem",
                textDecoration: "none",
              }}>
                Register Free →
              </a>
              <a href="/about" style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.07)", color: "#c0c8d8",
                padding: "14px 32px", borderRadius: 6,
                fontWeight: 600, fontSize: "0.9rem",
                textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)",
              }}>
                About NCIW
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
