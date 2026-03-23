import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "National Check-in Week 2026 — Community",
  description:
    "National Check-In Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
};

const PILLARS = [
  { icon: "🎙️", title: "Elevate Student Voices", body: "Create safe spaces where every student can identify, communicate, and learn to manage their emotions." },
  { icon: "📊", title: "Real-Time Wellbeing Data", body: "Move from reactive guesswork to proactive, data-informed decision-making across your whole school." },
  { icon: "🎓", title: "Expert-Led Free Webinars", body: "Access professional learning from Australia's leading wellbeing researchers and practitioners at no cost." },
  { icon: "🤝", title: "Whole-School Resources", body: "Curated tools for educators, students, and families — building community-wide resilience together." },
];

const TRUST_ITEMS = [
  { num: "FREE", label: "for every Australian school" },
  { num: "2026", label: "national movement in action" },
  { num: "15", label: "documented wellbeing issues addressed" },
  { num: "1000s", label: "of educators already registered" },
];

export default function Home3() {
  return (
    <div style={{ background: "#FFFBF5", color: "#3d3d3d", fontFamily: "var(--font-body)" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />

      {/* ── Hero ── */}
      <section style={{ padding: "80px 40px 72px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#FFF3E0", border: "1px solid #FFCC80",
              borderRadius: 100, padding: "6px 16px",
              fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#E65100",
              marginBottom: 28,
            }}>
              🌏 Australia 2026 · Free Initiative
            </div>

            <h1 style={{
              fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)",
              fontWeight: 900, lineHeight: 1.15,
              color: "#1a1a1a",
              marginBottom: 24,
              fontFamily: "var(--font-display)",
            }}>
              Supporting every student,{" "}
              <span style={{
                background: "linear-gradient(135deg, var(--primary) 0%, #0ea5e9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                together.
              </span>
            </h1>

            <p style={{
              fontSize: "1.05rem", color: "#6b5e4e",
              lineHeight: 1.85, marginBottom: 36,
            }}>
              National Check-In Week is a free initiative giving Australian school leaders the tools,
              data, and professional learning they need to ensure no child falls through the gaps.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/events" style={{
                display: "inline-block",
                background: "var(--primary)", color: "#fff",
                padding: "15px 28px", borderRadius: 50,
                fontWeight: 700, fontSize: "0.92rem",
                textDecoration: "none",
              }}>
                Register Free →
              </a>
              <a href="/about" style={{
                display: "inline-block",
                background: "#fff", color: "#3d3d3d",
                padding: "15px 28px", borderRadius: 50,
                fontWeight: 600, fontSize: "0.92rem",
                textDecoration: "none",
                border: "1.5px solid #e0d8cf",
              }}>
                Learn More
              </a>
            </div>
          </div>

          {/* Right: warm stats card */}
          <div style={{
            background: "#fff",
            borderRadius: 24,
            padding: "40px 36px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
            border: "1px solid #f0e8dc",
          }}>
            <p style={{
              fontSize: "0.75rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.12em",
              color: "#b07a5a", marginBottom: 24,
            }}>
              The Reality for Australian Schools
            </p>
            {[
              { num: "1 in 7", text: "children has a diagnosable mental disorder" },
              { num: "72%", text: "of mental health conditions start before age 25" },
              { num: "8×", text: "more effective: early intervention vs late-stage" },
              { num: "1 in 5", text: "young Australians felt lonely most of the time" },
            ].map((s) => (
              <div key={s.text} style={{
                display: "flex", alignItems: "center", gap: 16,
                paddingBottom: 16, marginBottom: 16,
                borderBottom: "1px solid #f5ece0",
              }}>
                <div style={{
                  minWidth: 72, fontSize: "1.4rem",
                  fontWeight: 900, color: "var(--primary)",
                  fontFamily: "var(--font-display)",
                }}>
                  {s.num}
                </div>
                <p style={{ fontSize: "0.88rem", color: "#7a6a5a", lineHeight: 1.55, margin: 0 }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main id="main-content">

        {/* ── Pillars ── */}
        <section style={{ padding: "72px 40px", background: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{
                fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "var(--primary)", marginBottom: 12,
              }}>
                How It Works
              </div>
              <h2 style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900,
                color: "#1a1a1a", fontFamily: "var(--font-display)",
              }}>
                Four pillars of the initiative
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              {PILLARS.map((p) => (
                <div key={p.title} style={{
                  background: "#FFFBF5",
                  border: "1.5px solid #f0e8dc",
                  borderRadius: 20,
                  padding: "32px 28px",
                }}>
                  <div style={{
                    width: 56, height: 56,
                    background: "linear-gradient(135deg, #FFF3E0 0%, #E0F4FD 100%)",
                    borderRadius: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.6rem", marginBottom: 20,
                  }}>
                    {p.icon}
                  </div>
                  <h3 style={{
                    fontSize: "1rem", fontWeight: 800,
                    color: "#1a1a1a", marginBottom: 10,
                  }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#7a6a5a", lineHeight: 1.7 }}>
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust numbers ── */}
        <section style={{ padding: "64px 40px", background: "#FFFBF5" }}>
          <div style={{
            maxWidth: 900, margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 2, background: "#f0e8dc", borderRadius: 20, overflow: "hidden",
          }}>
            {TRUST_ITEMS.map((t) => (
              <div key={t.label} style={{
                background: "#fff", padding: "36px 28px", textAlign: "center",
              }}>
                <div style={{
                  fontSize: "2rem", fontWeight: 900,
                  color: "var(--accent)", fontFamily: "var(--font-display)",
                  marginBottom: 8,
                }}>
                  {t.num}
                </div>
                <p style={{ fontSize: "0.82rem", color: "#9a8a7a", lineHeight: 1.5, margin: 0 }}>
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          padding: "80px 40px 100px",
          background: "linear-gradient(135deg, #E0F7FA 0%, #FFF3E0 100%)",
        }}>
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 20 }}>💙</div>
            <h2 style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 900, color: "#1a1a1a",
              fontFamily: "var(--font-display)",
              lineHeight: 1.2, marginBottom: 20,
            }}>
              No child should fall<br />through the gaps.
            </h2>
            <p style={{
              fontSize: "1.05rem", color: "#6b5e4e",
              lineHeight: 1.8, marginBottom: 40,
            }}>
              Join thousands of Australian educators taking proactive steps to support student
              wellbeing. National Check-In Week is free for every school and family.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/events" style={{
                display: "inline-block",
                background: "var(--primary)", color: "#fff",
                padding: "18px 40px", borderRadius: 50,
                fontWeight: 700, fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(41,184,232,0.3)",
              }}>
                Register Your School Free
              </a>
              <a href="/issues" style={{
                display: "inline-block",
                background: "#fff", color: "#3d3d3d",
                padding: "18px 40px", borderRadius: 50,
                fontWeight: 600, fontSize: "1rem",
                textDecoration: "none",
                border: "1.5px solid #e0d8cf",
              }}>
                Explore the Issues →
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
