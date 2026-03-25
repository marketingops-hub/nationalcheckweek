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
  title: "National Check-in Week 2026 — Minimal",
  description:
    "National Check-In Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
  openGraph: {
    title: "National Check-in Week 2026 — Minimal",
    description: "A free initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
    url: "https://2026schools.vercel.app/home1",
  },
};

const STATS = [
  { num: "Suicide", label: "leading cause of death, Australians aged 15–24" },
  { num: "1 in 7",  label: "children has a diagnosable mental disorder — most go undetected" },
  { num: "72%",     label: "of lifetime mental health conditions begin before age 25" },
  { num: "8×",      label: "more cost-effective to intervene early than treat a crisis" },
];

export default function Home1() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      <NewsTicker />

      {/* ── Hero: Minimal / Editorial ── */}
      <section style={{
        borderBottom: "1px solid #e8e8e8",
        background: "#fff",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "96px 40px 80px" }}>

          <div style={{
            display: "inline-block",
            fontSize: "0.65rem",
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--primary)",
            borderBottom: "2px solid var(--primary)",
            paddingBottom: 4,
            marginBottom: 40,
          }}>
            National Check-in Week · Australia 2026
          </div>

          <h1 style={{
            fontSize: "clamp(3rem, 7vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#0a0a0a",
            marginBottom: 32,
            fontFamily: "var(--font-display)",
            maxWidth: 820,
          }}>
            Every student deserves<br />
            to be{" "}
            <span style={{
              position: "relative",
              display: "inline-block",
              color: "var(--primary)",
            }}>
              checked in on.
            </span>
          </h1>

          <p style={{
            fontSize: "1.15rem",
            color: "#555",
            lineHeight: 1.85,
            maxWidth: 600,
            marginBottom: 48,
          }}>
            National Check-in Week is a <strong style={{ color: "#0a0a0a" }}>FREE</strong> initiative
            giving Australian school leaders the tools, data, and professional learning they need to
            support every student — before challenges become crises.
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/events" style={{
              display: "inline-block",
              background: "#0a0a0a",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.9rem",
              letterSpacing: "0.04em",
              padding: "16px 36px",
              textDecoration: "none",
            }}>
              Register for Free Webinars →
            </a>
            <a href="/issues" style={{
              display: "inline-block",
              color: "#0a0a0a",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              borderBottom: "2px solid var(--primary)",
              paddingBottom: 2,
            }}>
              Explore the Issues
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          borderTop: "1px solid #e8e8e8",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: "32px 36px",
              borderRight: i < 3 ? "1px solid #e8e8e8" : "none",
            }}>
              <div style={{
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                fontWeight: 900,
                color: "#0a0a0a",
                fontFamily: "var(--font-display)",
                lineHeight: 1,
                marginBottom: 10,
              }}>
                {s.num}
              </div>
              <p style={{ fontSize: "0.8rem", color: "#777", lineHeight: 1.6, margin: 0 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

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
