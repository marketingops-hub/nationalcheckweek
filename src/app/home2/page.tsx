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
  title: "National Check-in Week 2026 — Editorial",
  description:
    "National Check-In Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
  openGraph: {
    title: "National Check-in Week 2026 — Editorial",
    description: "A free initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
    url: "https://2026schools.vercel.app/home2",
  },
};

const STATS = [
  { num: "1 in 7",  body: "children has a diagnosable mental disorder — most go undetected in schools" },
  { num: "72%",     body: "of lifetime mental health conditions begin before age 25" },
  { num: "8×",      body: "more cost-effective to intervene early than treat a crisis" },
  { num: "Suicide", body: "is the leading cause of death for Australians aged 15–24" },
];

const ISSUES = [
  { tag: "CRITICAL",  title: "Anxiety & Depression",     body: "Affects 13.9% of children aged 4–17. The most prevalent condition — and the most under-served by existing school systems." },
  { tag: "CRITICAL",  title: "Self-Harm & Suicidality",  body: "AIHW maps regional estimates at PHN and SA3 level. Most cases never reach a professional before a crisis event." },
  { tag: "WIDESPREAD",title: "Bullying at School",        body: "46,000+ documented incidents in Queensland schools alone in 2023. Peer aggression remains the silent driver of chronic absence." },
];

export default function Home2() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      <NewsTicker />

      {/* ── COVER HERO ── */}
      <section style={{ background: "#0a0a0a", color: "#fff", position: "relative", overflow: "hidden" }}>
        {/* Issue number label */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "12px 48px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
            National Check-in Week · Australia 2026 · Vol. I
          </span>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
            Free for Every School
          </span>
        </div>

        {/* Main cover */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 48px 0", display: "grid", gridTemplateColumns: "1fr 420px", gap: 0, alignItems: "end", minHeight: 580 }}>
          <div style={{ paddingBottom: 80 }}>
            <div style={{
              display: "inline-block",
              background: "var(--primary)",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "6px 14px",
              marginBottom: 36,
            }}>
              National Emergency
            </div>

            <h1 style={{
              fontSize: "clamp(3.5rem, 8vw, 7rem)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#fff",
              marginBottom: 36,
              fontFamily: "var(--font-display)",
              textTransform: "uppercase",
            }}>
              Every<br />
              <span style={{ color: "var(--primary)", WebkitTextStroke: "0px" }}>Student</span><br />
              Deserves<br />
              To Be<br />
              <span style={{
                color: "transparent",
                WebkitTextStroke: "2px rgba(255,255,255,0.6)",
              }}>
                Seen.
              </span>
            </h1>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/events" style={{
                display: "inline-block",
                background: "#fff",
                color: "#0a0a0a",
                fontWeight: 900,
                fontSize: "0.8rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "16px 32px",
                textDecoration: "none",
              }}>
                Register Free →
              </a>
              <a href="/issues" style={{
                display: "inline-block",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 700,
                fontSize: "0.8rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "16px 32px",
                textDecoration: "none",
              }}>
                Read the Issues
              </a>
            </div>
          </div>

          {/* Right: Pull quote panel */}
          <div style={{
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            padding: "0 0 80px 48px",
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 32,
          }}>
            <div>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 16 }}>Lead Statistic</div>
              <div style={{ fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 900, color: "var(--primary)", fontFamily: "var(--font-display)", lineHeight: 0.9 }}>1 in 7</div>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginTop: 12, maxWidth: 240 }}>
                Australian children has a diagnosable mental disorder. Most are never identified inside the school system.
              </p>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24 }}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 10 }}>Cost of Inaction</div>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)", lineHeight: 0.9 }}>8×</div>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginTop: 10 }}>
                more expensive to treat a crisis than to intervene early.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          overflow: "hidden",
        }}>
          {["Anxiety & Depression", "Self-Harm", "Bullying", "Cyberbullying", "Loneliness", "Attendance Gaps", "Trauma", "Substance Use"].map((item, i) => (
            <div key={item} style={{
              flex: "0 0 auto",
              padding: "12px 24px",
              borderRight: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: i === 0 ? "var(--primary)" : "rgba(255,255,255,0.3)",
              whiteSpace: "nowrap",
            }}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <main id="main-content">

        {/* ── Stats — editorial ruled layout ── */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
          <div style={{
            borderBottom: "3px solid #0a0a0a",
            padding: "56px 0 0",
            marginBottom: 0,
          }}>
            <div style={{
              fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.25em",
              textTransform: "uppercase", color: "#999",
              marginBottom: 32, display: "flex", alignItems: "center", gap: 16,
            }}>
              <span style={{ display: "inline-block", width: 24, height: 2, background: "var(--primary)" }} />
              The Data on Australian Student Wellbeing
            </div>
          </div>

          {STATS.map((s, i) => (
            <div key={s.num} style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              borderBottom: "1px solid #e0e0e0",
              padding: "40px 0",
              gap: 48,
              alignItems: "center",
            }}>
              <div style={{
                fontSize: i === 3 ? "clamp(2rem, 4vw, 3.2rem)" : "clamp(3rem, 6vw, 5rem)",
                fontWeight: 900,
                fontFamily: "var(--font-display)",
                color: "#0a0a0a",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}>
                {s.num}
              </div>
              <p style={{
                fontSize: "1.05rem",
                color: "#444",
                lineHeight: 1.75,
                margin: 0,
                fontWeight: 400,
              }}>
                {s.body}
              </p>
            </div>
          ))}
        </section>

        {/* ── Full-bleed pull quote ── */}
        <section style={{
          background: "var(--primary)",
          padding: "80px 48px",
          marginTop: 80,
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{
              fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.25em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.6)",
              marginBottom: 28, display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ display: "inline-block", width: 20, height: 1.5, background: "rgba(255,255,255,0.5)" }} />
              The Movement
            </div>
            <blockquote style={{
              fontSize: "clamp(2rem, 4.5vw, 3.8rem)",
              fontWeight: 900,
              color: "#fff",
              fontFamily: "var(--font-display)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 900,
              margin: "0 0 40px",
            }}>
              "No child should fall through the gaps — regardless of background, identity, or location."
            </blockquote>
            <a href="/events" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "#0a0a0a",
              color: "#fff",
              fontWeight: 900,
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "18px 36px",
              textDecoration: "none",
            }}>
              Register Your School Free →
            </a>
          </div>
        </section>

        {/* ── Issues — editorial cards ── */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 48px 100px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            borderBottom: "3px solid #0a0a0a", paddingBottom: 20, marginBottom: 0,
          }}>
            <div style={{
              fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.25em",
              textTransform: "uppercase", color: "#999",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <span style={{ display: "inline-block", width: 24, height: 2, background: "#0a0a0a" }} />
              Issue Database — Top 3 by Impact
            </div>
            <a href="/issues" style={{
              fontSize: "0.7rem", fontWeight: 800, color: "#0a0a0a",
              letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none",
            }}>
              All 15 Issues →
            </a>
          </div>

          {ISSUES.map((issue, i) => (
            <div key={issue.title} style={{
              display: "grid",
              gridTemplateColumns: "64px 1fr",
              borderBottom: "1px solid #e0e0e0",
              padding: "40px 0",
              gap: 32,
            }}>
              <div>
                <div style={{
                  fontSize: "0.55rem", fontWeight: 900, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: i === 2 ? "#E65100" : "var(--primary)",
                  border: `1px solid ${i === 2 ? "#E65100" : "var(--primary)"}`,
                  padding: "4px 8px",
                  display: "inline-block",
                  lineHeight: 1.4,
                }}>
                  {issue.tag}
                </div>
              </div>
              <div>
                <h3 style={{
                  fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                  fontWeight: 900,
                  color: "#0a0a0a",
                  fontFamily: "var(--font-display)",
                  marginBottom: 16,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}>
                  {issue.title}
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#555", lineHeight: 1.8, maxWidth: 680 }}>
                  {issue.body}
                </p>
              </div>
            </div>
          ))}
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
