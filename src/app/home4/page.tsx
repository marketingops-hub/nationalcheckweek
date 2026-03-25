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
  title: "National Check-in Week 2026 — Impact",
  description:
    "National Check-In Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
  openGraph: {
    title: "National Check-in Week 2026 — Impact",
    description: "A free initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
    url: "https://2026schools.vercel.app/home4",
  },
};

const METRICS = [
  { num: "~580K", label: "Children aged 4–17 with a diagnosable mental disorder",  source: "Young Minds Matter" },
  { num: "72%",   label: "Lifetime mental health conditions begin before age 25",   source: "Beyond Blue / AIHW" },
  { num: "8×",    label: "More cost-effective: early intervention vs crisis",       source: "Productivity Commission" },
  { num: "57%",   label: "Average attendance: very remote vs 93% city schools",    source: "RoGS 2026" },
  { num: "1 in 5",label: "Young Australians felt lonely most or all of the time",  source: "Mission Australia 2024" },
  { num: "38%",   label: "Experienced cyberbullying in the past 12 months",        source: "eSafety Commissioner" },
];

const PILLARS = [
  { n: "01", title: "Elevate Student Voices",  body: "Create safe spaces where students can identify and communicate their emotions without stigma." },
  { n: "02", title: "Real-Time Wellbeing Data",body: "Proactive, data-informed decision-making across your whole school — not reactive guesswork." },
  { n: "03", title: "Expert-Led Webinars",     body: "Professional learning from Australia's leading wellbeing researchers, at no cost." },
  { n: "04", title: "Whole-School Community",  body: "Tools for educators, students, and families — building resilience together." },
];

const ISSUES = [
  { slug: "anxiety-depression",    title: "Anxiety & Depression",    stat: "13.9%",   tag: "Critical" },
  { slug: "self-harm-suicidality", title: "Self-Harm & Suicidality", stat: "Leading", tag: "Critical" },
  { slug: "bullying",              title: "Bullying at School",       stat: "46K+",    tag: "Critical" },
  { slug: "cyberbullying",         title: "Cyberbullying",            stat: "38%",     tag: "High" },
  { slug: "distress-loneliness",   title: "Loneliness & Distress",   stat: "1 in 5",  tag: "High" },
];

export default function Home4() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      <NewsTicker />

      {/* ── Hero — split gradient ── */}
      <section style={{
        background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)",
        padding: "0",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Gradient mesh */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 20% 80%, rgba(41,184,232,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(229,0,126,0.15) 0%, transparent 50%)",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 48px 0", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "end" }}>

            {/* Left copy */}
            <div style={{ paddingBottom: 80 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(41,184,232,0.12)",
                border: "1px solid rgba(41,184,232,0.3)",
                borderRadius: 6,
                padding: "6px 14px",
                marginBottom: 32,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#29B8E8", display: "inline-block" }} aria-hidden="true" />
                <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#29B8E8" }}>
                  National Check-in Week · Australia 2026
                </span>
              </div>

              <h1 style={{
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#fff",
                marginBottom: 28,
                fontFamily: "var(--font-display)",
              }}>
                Student wellbeing data
                <span style={{ display: "block", background: "linear-gradient(90deg, #29B8E8, #E5007E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  for every school.
                </span>
              </h1>

              <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.8, maxWidth: 480, marginBottom: 40 }}>
                A free, evidence-based initiative giving school leaders real-time wellbeing data,
                professional learning, and early-intervention tools.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="/events" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "linear-gradient(135deg, #29B8E8, #E5007E)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  padding: "14px 30px",
                  borderRadius: 8,
                  textDecoration: "none",
                  boxShadow: "0 8px 32px rgba(41,184,232,0.4)",
                }}>
                  Register Free →
                </a>
                <a href="/issues" style={{
                  display: "inline-flex", alignItems: "center",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  padding: "14px 30px",
                  borderRadius: 8,
                  textDecoration: "none",
                }}>
                  View Issue Database →
                </a>
              </div>
            </div>

            {/* Right — key numbers stacked */}
            <div style={{ paddingBottom: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { num: "15", label: "Documented issues", sub: "Evidence-based, nationally sourced" },
                { num: "FREE", label: "For every school", sub: "No cost to educators, families, or students" },
                { num: "2026", label: "National movement", sub: "Australia's largest student wellbeing initiative" },
              ].map((item, i) => (
                <div key={item.label} style={{
                  padding: "28px 32px",
                  background: i === 1 ? "rgba(41,184,232,0.08)" : "rgba(255,255,255,0.03)",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                }}>
                  <div style={{
                    fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                    fontWeight: 900,
                    color: i === 1 ? "#29B8E8" : "#fff",
                    fontFamily: "var(--font-display)",
                    lineHeight: 1,
                    minWidth: 80,
                  }}>
                    {item.num}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      <main id="main-content">

        {/* ── Metrics grid ── */}
        <section style={{ padding: "72px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: 8 }}>The Evidence</div>
              <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "#0f1117", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
                Key metrics on Australian student wellbeing
              </h2>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#999" }}>Sources: AIHW · RoGS 2026 · Mission Australia · eSafety Commissioner</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, background: "#e8eaf0", borderRadius: 16, overflow: "hidden", border: "1px solid #e8eaf0" }}>
            {METRICS.map((m, i) => (
              <div key={m.label} style={{
                background: "#fff",
                padding: "28px 24px",
                position: "relative",
                overflow: "hidden",
              }}>
                <div aria-hidden="true" style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: 3,
                  background: i % 3 === 0 ? "linear-gradient(90deg, #29B8E8, #8B5CF6)"
                    : i % 3 === 1 ? "linear-gradient(90deg, #E5007E, #fb923c)"
                    : "linear-gradient(90deg, #34d399, #29B8E8)",
                }} />
                <div style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                  fontWeight: 900,
                  color: "#0f1117",
                  fontFamily: "var(--font-display)",
                  lineHeight: 1,
                  marginBottom: 8,
                }}>
                  {m.num}
                </div>
                <p style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6, marginBottom: 12 }}>{m.label}</p>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#bbb", letterSpacing: "0.08em" }}>{m.source}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Issues — vivid row cards ── */}
        <section style={{ background: "#f7f8fc", padding: "72px 48px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: 8 }}>Issue Database</div>
                <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "#0f1117", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
                  Top 5 issues by severity
                </h2>
              </div>
              <a href="/issues" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>View all 15 →</a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ISSUES.map((issue, i) => (
                <a key={issue.slug} href={`/issues/${issue.slug}`} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  background: "#fff",
                  border: "1px solid #eaedf2",
                  borderRadius: 12,
                  padding: "20px 24px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                }}>
                  {/* Rank */}
                  <div style={{ minWidth: 32, fontSize: "0.75rem", fontWeight: 800, color: "#c0c5d0", fontFamily: "var(--font-display)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  {/* Stat blob */}
                  <div style={{
                    minWidth: 80, height: 52,
                    background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)",
                    borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.9rem", fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)",
                  }}>
                    {issue.stat}
                  </div>
                  {/* Title */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.97rem", fontWeight: 800, color: "#0f1117" }}>{issue.title}</div>
                  </div>
                  {/* Tag */}
                  <div style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: "0.65rem", fontWeight: 800,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: issue.tag === "Critical" ? "#FEF2F2" : "#FFFBEB",
                    color: issue.tag === "Critical" ? "#DC2626" : "#D97706",
                    border: issue.tag === "Critical" ? "1px solid #FCA5A5" : "1px solid #FCD34D",
                  }}>
                    {issue.tag}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4 Pillars ── */}
        <section style={{ padding: "72px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: 10 }}>How It Works</div>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900, color: "#0f1117", fontFamily: "var(--font-display)" }}>
              Four pillars of the initiative
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {PILLARS.map((p, i) => (
              <div key={p.n} style={{
                borderRadius: 16,
                padding: "32px 28px",
                background: i % 2 === 0 ? "#0f1117" : "#fff",
                border: i % 2 !== 0 ? "1px solid #eaedf2" : "none",
              }}>
                <div style={{
                  fontSize: "clamp(2.4rem, 5vw, 3.2rem)",
                  fontWeight: 900,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1,
                  marginBottom: 20,
                  background: i % 2 === 0
                    ? "linear-gradient(135deg, #29B8E8, #8B5CF6)"
                    : "linear-gradient(135deg, #E5007E, #fb923c)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {p.n}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: i % 2 === 0 ? "#fff" : "#0f1117", marginBottom: 10 }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: i % 2 === 0 ? "rgba(255,255,255,0.5)" : "#666", lineHeight: 1.7, margin: 0 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: "0 48px 100px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 60%, #0f1117 100%)",
            borderRadius: 24,
            padding: "72px 64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 40,
            position: "relative",
            overflow: "hidden",
          }}>
            <div aria-hidden="true" style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 0% 50%, rgba(41,184,232,0.18) 0%, transparent 50%), radial-gradient(ellipse at 100% 50%, rgba(229,0,126,0.15) 0%, transparent 50%)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <h2 style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: 900, color: "#fff",
                fontFamily: "var(--font-display)",
                lineHeight: 1.1, marginBottom: 12,
              }}>
                Register your school for free.
              </h2>
              <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.45)", margin: 0 }}>
                Free webinars · Real-time data tools · No cost to any school or family
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", position: "relative" }}>
              <a href="/events" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg, #29B8E8, #E5007E)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.9rem",
                padding: "16px 36px",
                borderRadius: 8,
                textDecoration: "none",
                boxShadow: "0 8px 32px rgba(41,184,232,0.35)",
              }}>
                Register Free →
              </a>
              <a href="/about" style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 700,
                fontSize: "0.9rem",
                padding: "16px 36px",
                borderRadius: 8,
                textDecoration: "none",
              }}>
                About NCIW
              </a>
            </div>
          </div>
        </section>

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
