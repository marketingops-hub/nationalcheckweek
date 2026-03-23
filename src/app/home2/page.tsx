import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "National Check-in Week 2026 — Bold",
  description:
    "National Check-In Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
};

const HERO_STATS = [
  { num: "1 in 7",  label: "children has a diagnosable mental disorder — most go undetected" },
  { num: "72%",     label: "of lifetime mental health conditions begin before age 25" },
  { num: "8×",      label: "more cost-effective to intervene early than treat a crisis" },
  { num: "Suicide", label: "is the leading cause of death for Australians aged 15–24" },
];

const ISSUES_PREVIEW = [
  { icon: "😰", title: "Anxiety & Depression", stat: "13.9% of children aged 4–17 have a mental disorder" },
  { icon: "🆘", title: "Self-Harm & Suicidality", stat: "AIHW maps regional estimates at PHN and SA3 level nationally" },
  { icon: "👊", title: "Bullying at School", stat: "46,000+ bullying incidents in Queensland schools in 2023 alone" },
];

export default function Home2() {
  return (
    <div style={{ background: "#0d0d0d", color: "#f0f0f0", fontFamily: "var(--font-body)", minHeight: "100vh" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Nav wrapper with dark override */}
      <div style={{ background: "#111" }}>
        <Nav />
      </div>

      {/* ── Hero ── */}
      <section style={{
        padding: "100px 40px 80px",
        maxWidth: 1100,
        margin: "0 auto",
        position: "relative",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: 0, left: "10%", width: 600, height: 500,
          background: "radial-gradient(ellipse at center, rgba(41,184,232,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(41,184,232,0.12)", border: "1px solid rgba(41,184,232,0.3)",
          borderRadius: 100, padding: "6px 16px",
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--primary)",
          marginBottom: 36,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} />
          National Check-in Week · Australia 2026
        </div>

        <h1 style={{
          fontSize: "clamp(3rem, 7vw, 5.5rem)",
          fontWeight: 900,
          lineHeight: 1.0,
          letterSpacing: "-0.03em",
          color: "#fff",
          marginBottom: 28,
          fontFamily: "var(--font-display)",
          maxWidth: 800,
        }}>
          Every student deserves to be{" "}
          <span style={{
            color: "transparent",
            WebkitTextStroke: "2px var(--primary)",
          }}>
            seen.
          </span>
        </h1>

        <p style={{
          fontSize: "1.1rem", color: "#aaa",
          lineHeight: 1.8, maxWidth: 560, marginBottom: 48,
        }}>
          A free initiative giving Australian school leaders the tools, data, and professional
          learning they need to support every student — before challenges become crises.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 80 }}>
          <a href="/events" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--primary)", color: "#fff",
            padding: "16px 32px", borderRadius: 8,
            fontWeight: 700, fontSize: "0.95rem",
            textDecoration: "none",
          }}>
            Register for Free Webinars
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="/issues" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.06)", color: "#fff",
            padding: "16px 32px", borderRadius: 8,
            fontWeight: 600, fontSize: "0.95rem",
            textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)",
          }}>
            Explore the Issues →
          </a>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 1,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {HERO_STATS.map((s) => (
            <div key={s.label} style={{
              padding: "28px 24px",
              background: "#111",
            }}>
              <div style={{
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                fontWeight: 900, color: "var(--primary)",
                fontFamily: "var(--font-display)",
                marginBottom: 8, lineHeight: 1,
              }}>
                {s.num}
              </div>
              <p style={{ fontSize: "0.82rem", color: "#888", lineHeight: 1.6, margin: 0 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <main id="main-content">

        {/* ── Stat ticker strip ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          padding: "20px 40px",
          display: "flex", gap: 48, overflowX: "auto",
        }}>
          {[
            { num: "~580K", desc: "children with a diagnosable mental disorder" },
            { num: "38%", desc: "experienced cyberbullying in the past 12 months" },
            { num: "1 in 5", desc: "young Australians felt lonely most of the time" },
            { num: "57%", desc: "avg attendance in remote vs 93% city schools" },
          ].map((t) => (
            <div key={t.desc} style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              <span style={{
                fontSize: "1.3rem", fontWeight: 900, color: "var(--accent)",
                fontFamily: "var(--font-display)", whiteSpace: "nowrap",
              }}>{t.num}</span>
              <span style={{ fontSize: "0.8rem", color: "#666", maxWidth: 160, lineHeight: 1.4 }}>{t.desc}</span>
            </div>
          ))}
        </div>

        {/* ── Issues preview ── */}
        <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 40, flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <div style={{
                fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "var(--primary)", marginBottom: 12,
              }}>
                The Crisis Is Real
              </div>
              <h2 style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: 900, color: "#fff",
                fontFamily: "var(--font-display)", lineHeight: 1.15,
              }}>
                15 documented issues.<br />Most go undetected.
              </h2>
            </div>
            <a href="/issues" style={{
              color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem",
              textDecoration: "none", whiteSpace: "nowrap",
            }}>
              View all 15 issues →
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 2 }}>
            {ISSUES_PREVIEW.map((issue) => (
              <div key={issue.title} style={{
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "32px 28px",
                transition: "border-color 0.2s",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: 16 }}>{issue.icon}</div>
                <h3 style={{
                  fontSize: "1.05rem", fontWeight: 800, color: "#fff", marginBottom: 12,
                }}>
                  {issue.title}
                </h3>
                <p style={{ fontSize: "0.83rem", color: "#666", lineHeight: 1.65 }}>
                  {issue.stat}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Movement block ── */}
        <section style={{
          margin: "0 40px 80px",
          maxWidth: 1020, marginLeft: "auto", marginRight: "auto",
          background: "linear-gradient(135deg, rgba(41,184,232,0.08) 0%, rgba(229,0,126,0.06) 100%)",
          border: "1px solid rgba(41,184,232,0.2)",
          borderRadius: 20, padding: "56px 52px",
        }}>
          <div style={{
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--primary)", marginBottom: 16,
          }}>
            If Not Now, When?
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            fontWeight: 900, color: "#fff", marginBottom: 20,
            fontFamily: "var(--font-display)", lineHeight: 1.15,
          }}>
            Unite for a New Era in<br />Student Wellbeing
          </h2>
          <p style={{ fontSize: "1.0rem", color: "#888", lineHeight: 1.8, maxWidth: 560, marginBottom: 36 }}>
            Two in five young people are living with a mental health condition, yet many schools
            still lack the tools needed to act early. All events, tools and resources are{" "}
            <strong style={{ color: "#fff" }}>free</strong> for every school and family.
          </p>
          <a href="/events" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--primary)", color: "#fff",
            padding: "16px 36px", borderRadius: 8,
            fontWeight: 700, fontSize: "1rem", textDecoration: "none",
          }}>
            Register for Free →
          </a>
        </section>

      </main>

      <div style={{ background: "#0d0d0d" }}>
        <Footer />
      </div>
    </div>
  );
}
