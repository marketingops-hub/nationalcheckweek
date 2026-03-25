import Nav from "@/components/Nav";
import NewsTicker from "@/components/NewsTicker";
import IntroSection from "@/components/IntroSection";
import StatTicker from "@/components/StatTicker";
import MapSection from "@/components/MapSection";
import IssuesSection from "@/components/IssuesSection";
import LifeSkillsSection from "@/components/LifeSkillsSection";
import ResearchSection from "@/components/ResearchSection";
import DataSection from "@/components/DataSection";
import PartnersCarousel from "@/components/PartnersCarousel";
import MovementSection from "@/components/MovementSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export const metadata = {
  title: "National Check-in Week 2026 — Aurora",
  description:
    "National Check-In Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
  openGraph: {
    title: "National Check-in Week 2026 — Aurora",
    description: "A free initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
    url: "https://2026schools.vercel.app/home3",
  },
};

const STATS = [
  { num: "1 in 7",  label: "children has a diagnosable mental disorder" },
  { num: "72%",     label: "of conditions begin before age 25" },
  { num: "8×",      label: "early intervention vs crisis cost" },
  { num: "1 in 5",  label: "young Australians felt lonely always" },
];

const PILLARS = [
  { icon: "🎙️", title: "Elevate Student Voices",  body: "Safe spaces where every student can identify and communicate their emotions without stigma." },
  { icon: "📊", title: "Real-Time Wellbeing Data", body: "Shift from reactive guesswork to proactive, data-informed decisions across your whole school." },
  { icon: "🎓", title: "Expert-Led Webinars",      body: "Professional learning from Australia's leading wellbeing researchers — at no cost." },
  { icon: "🤝", title: "Whole-School Resources",   body: "Tools for educators, students, and families building community-wide resilience together." },
];

const ISSUES = [
  { title: "Anxiety & Depression",    stat: "13.9%", unit: "of children 4–17", color: "#f87171" },
  { title: "Self-Harm & Suicidality", stat: "#1",    unit: "cause of death 15–24", color: "#fb923c" },
  { title: "Cyberbullying",           stat: "38%",   unit: "experienced in past 12mo", color: "#a78bfa" },
  { title: "Loneliness & Distress",   stat: "1 in 5",unit: "felt lonely most of the time", color: "#34d399" },
];

export default function Home3() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      <NewsTicker />

      {/* ── Aurora hero wrapper ── */}
      <div style={{ background: "#07060f", color: "#e8e6f0", fontFamily: "var(--font-body)", position: "relative", overflow: "hidden" }}>

      {/* ── Global aurora orbs ── */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(41,184,232,0.18) 0%, transparent 65%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "10%", right: "-15%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(229,0,126,0.14) 0%, transparent 65%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "20%", left: "30%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 65%)", filter: "blur(50px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Hero ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 48px 80px" }}>
          {/* Pill badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(41,184,232,0.1)",
            border: "1px solid rgba(41,184,232,0.25)",
            borderRadius: 100,
            padding: "7px 18px",
            marginBottom: 40,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} aria-hidden="true" />
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--primary)" }}>
              Australia 2026 · Free National Initiative
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(3rem, 7vw, 6rem)",
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            color: "#fff",
            marginBottom: 32,
            fontFamily: "var(--font-display)",
            maxWidth: 820,
          }}>
            Supporting every{" "}
            <span style={{
              background: "linear-gradient(135deg, #29B8E8 0%, #8B5CF6 50%, #E5007E 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              student,
            </span>
            <br />together.
          </h1>

          <p style={{
            fontSize: "1.15rem",
            color: "rgba(232,230,240,0.6)",
            lineHeight: 1.85,
            maxWidth: 580,
            marginBottom: 48,
          }}>
            A free initiative giving Australian school leaders the tools, data, and professional
            learning they need — before challenges become crises.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 80 }}>
            <a href="/events" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #29B8E8 0%, #8B5CF6 100%)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.9rem",
              padding: "15px 32px",
              borderRadius: 100,
              textDecoration: "none",
              letterSpacing: "0.01em",
              boxShadow: "0 0 40px rgba(41,184,232,0.35)",
            }}>
              Register Free →
            </a>
            <a href="/issues" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.75)",
              fontWeight: 700,
              fontSize: "0.9rem",
              padding: "15px 32px",
              borderRadius: 100,
              textDecoration: "none",
              backdropFilter: "blur(12px)",
            }}>
              Explore the Issues
            </a>
          </div>

          {/* Stats strip — glass cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}>
            {STATS.map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "24px 22px",
                backdropFilter: "blur(20px)",
              }}>
                <div style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                  lineHeight: 1,
                  marginBottom: 8,
                }}>
                  {s.num}
                </div>
                <p style={{ fontSize: "0.78rem", color: "rgba(232,230,240,0.5)", lineHeight: 1.5, margin: 0 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <main id="main-content">

          {/* ── Issue cards ── */}
          <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 80px" }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(232,230,240,0.35)", marginBottom: 12 }}>
                The Crisis Is Real
              </div>
              <h2 style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 900,
                color: "#fff",
                fontFamily: "var(--font-display)",
                lineHeight: 1.15,
              }}>
                15 documented issues.<br />
                <span style={{ color: "rgba(232,230,240,0.4)", fontWeight: 400 }}>Most go undetected.</span>
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 2, borderRadius: 20, overflow: "hidden" }}>
              {ISSUES.map((issue) => (
                <div key={issue.title} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "32px 28px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div aria-hidden="true" style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${issue.color}, transparent)`,
                  }} />
                  <div style={{
                    fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                    fontWeight: 900,
                    color: issue.color,
                    fontFamily: "var(--font-display)",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}>
                    {issue.stat}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(232,230,240,0.4)", marginBottom: 16 }}>{issue.unit}</div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>{issue.title}</h3>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <a href="/issues" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
                View all 15 documented issues →
              </a>
            </div>
          </section>

          {/* ── Pillars ── */}
          <section style={{
            margin: "0 48px 80px",
            maxWidth: 1100,
            marginLeft: "auto",
            marginRight: "auto",
            padding: "56px 48px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 24,
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(232,230,240,0.35)", marginBottom: 14 }}>
                How It Works
              </div>
              <h2 style={{
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                fontWeight: 900, color: "#fff",
                fontFamily: "var(--font-display)",
              }}>
                Four pillars of the initiative
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {PILLARS.map((p, i) => (
                <div key={p.title} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "28px 24px",
                }}>
                  <div style={{
                    width: 48, height: 48,
                    borderRadius: 12,
                    background: i % 2 === 0
                      ? "rgba(41,184,232,0.12)"
                      : "rgba(139,92,246,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.4rem", marginBottom: 18,
                    border: `1px solid ${i % 2 === 0 ? "rgba(41,184,232,0.2)" : "rgba(139,92,246,0.2)"}`,
                  }}>
                    {p.icon}
                  </div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", marginBottom: 10 }}>{p.title}</h3>
                  <p style={{ fontSize: "0.83rem", color: "rgba(232,230,240,0.5)", lineHeight: 1.7, margin: 0 }}>{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 48px" }}>
            <div style={{
              position: "relative",
              borderRadius: 28,
              padding: "72px 64px",
              overflow: "hidden",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              {/* Aurora behind CTA */}
              <div aria-hidden="true" style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 30% 50%, rgba(41,184,232,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(229,0,126,0.12) 0%, transparent 60%)",
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
                <h2 style={{
                  fontSize: "clamp(2rem, 4vw, 3.2rem)",
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.1,
                  marginBottom: 20,
                  letterSpacing: "-0.02em",
                }}>
                  No child should fall<br />through the gaps.
                </h2>
                <p style={{
                  fontSize: "1.0rem",
                  color: "rgba(232,230,240,0.55)",
                  lineHeight: 1.8,
                  marginBottom: 40,
                }}>
                  Join thousands of Australian educators. All webinars, tools, and resources
                  are <strong style={{ color: "#fff" }}>free</strong> for every school and family.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <a href="/events" style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "linear-gradient(135deg, #29B8E8 0%, #8B5CF6 100%)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    padding: "17px 40px",
                    borderRadius: 100,
                    textDecoration: "none",
                    boxShadow: "0 0 48px rgba(41,184,232,0.3)",
                  }}>
                    Register Your School Free
                  </a>
                  <a href="/issues" style={{
                    display: "inline-flex", alignItems: "center",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    padding: "17px 40px",
                    borderRadius: 100,
                    textDecoration: "none",
                  }}>
                    Explore the Issues →
                  </a>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
      </div>

      {/* ── Full content — light bg ── */}
      <main id="main-content">
        <IntroSection />
        <StatTicker />
        <MapSection />
        <IssuesSection />
        <LifeSkillsSection />
        <ResearchSection />
        <DataSection />
        <PartnersCarousel />
        <MovementSection />
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}
