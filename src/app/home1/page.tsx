import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "National Check-in Week 2026 — Minimal",
  description:
    "National Check-In Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student.",
};

export default function Home1() {
  return (
    <div style={{ background: "#fff", color: "#2a2a2a", fontFamily: "var(--font-body)" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />

      {/* ── Hero ── */}
      <section style={{
        padding: "120px 40px 100px",
        maxWidth: 820,
        margin: "0 auto",
      }}>
        <div style={{
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "var(--primary)",
          marginBottom: 32,
        }}>
          National Check-in Week · Australia 2026
        </div>
        <h1 style={{
          fontSize: "clamp(2.6rem, 6vw, 4.5rem)",
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "#111",
          marginBottom: 32,
          fontFamily: "var(--font-display)",
        }}>
          Every student<br />
          deserves to be<br />
          <span style={{ color: "var(--primary)" }}>checked in on.</span>
        </h1>
        <p style={{
          fontSize: "1.15rem",
          color: "#6b6b6b",
          lineHeight: 1.85,
          maxWidth: 580,
          marginBottom: 48,
        }}>
          A free initiative giving Australian school leaders the tools, data, and professional
          learning they need to support every student — before challenges become crises.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="/events" style={{
            display: "inline-block",
            background: "#111",
            color: "#fff",
            padding: "16px 32px",
            borderRadius: 4,
            fontWeight: 700,
            fontSize: "0.95rem",
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}>
            Register for Free Webinars
          </a>
          <a href="/issues" style={{
            display: "inline-block",
            color: "#111",
            padding: "16px 0",
            fontWeight: 600,
            fontSize: "0.95rem",
            textDecoration: "none",
            borderBottom: "2px solid var(--primary)",
          }}>
            Explore the Issues →
          </a>
        </div>
      </section>

      {/* ── Thin divider ── */}
      <div style={{ maxWidth: 820, margin: "0 auto 0", padding: "0 40px" }}>
        <div style={{ height: 1, background: "#e5e5e5" }} />
      </div>

      <main id="main-content">

        {/* ── What is NCIW ── */}
        <section style={{ padding: "80px 40px", maxWidth: 820, margin: "0 auto" }}>
          <div style={{
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--primary)", marginBottom: 24,
          }}>
            About the Initiative
          </div>
          <h2 style={{
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            fontWeight: 800, color: "#111", marginBottom: 24,
            lineHeight: 1.25, fontFamily: "var(--font-display)",
          }}>
            What is National Check-In Week?
          </h2>
          <p style={{ fontSize: "1.05rem", color: "#555", lineHeight: 1.85, marginBottom: 20 }}>
            National Check-In Week (NCIW) was founded with a clear mission: to ensure that{" "}
            <strong style={{ color: "#111" }}>no child falls through the gaps</strong> — regardless
            of their background, identity, or location. Australian schools are at a critical crossroads,
            yet many still lack the tools, data, and professional learning needed to act early.
          </p>
          <p style={{ fontSize: "1.05rem", color: "#555", lineHeight: 1.85 }}>
            NCIW 2026 is more than a campaign — it&apos;s a national movement to elevate student voices,
            challenge outdated wellbeing practices, and drive systemic, generational change.
          </p>
        </section>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ height: 1, background: "#e5e5e5" }} />
        </div>

        {/* ── 4 principles as a minimal list ── */}
        <section style={{ padding: "80px 40px", maxWidth: 820, margin: "0 auto" }}>
          <div style={{
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--primary)", marginBottom: 24,
          }}>
            Four Commitments
          </div>
          {[
            { n: "01", title: "Elevate student voices", body: "Create safe spaces where students can identify and communicate their emotions without stigma." },
            { n: "02", title: "Real-time wellbeing data", body: "Move from reactive assessments to proactive, data-informed decision-making in every school." },
            { n: "03", title: "Expert-led free webinars", body: "Access professional learning from Australia's leading wellbeing researchers and practitioners." },
            { n: "04", title: "Whole-school community", body: "Bring together educators, families, and students around a shared commitment to thriving together." },
          ].map((item) => (
            <div key={item.n} style={{
              display: "grid", gridTemplateColumns: "48px 1fr",
              gap: 24, paddingBottom: 40, marginBottom: 40,
              borderBottom: "1px solid #e5e5e5",
            }}>
              <div style={{
                fontSize: "0.85rem", fontWeight: 700, color: "#ccc",
                fontFamily: "var(--font-display)", paddingTop: 4,
              }}>
                {item.n}
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111", marginBottom: 10 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#777", lineHeight: 1.75 }}>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ── CTA ── */}
        <section style={{
          padding: "80px 40px 100px",
          maxWidth: 820, margin: "0 auto",
        }}>
          <div style={{ height: 1, background: "#e5e5e5", marginBottom: 80 }} />
          <div style={{
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--primary)", marginBottom: 24,
          }}>
            Join the Movement
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 900,
            color: "#111", marginBottom: 20, fontFamily: "var(--font-display)",
            lineHeight: 1.15,
          }}>
            No child should fall<br />through the gaps.
          </h2>
          <p style={{ fontSize: "1.05rem", color: "#777", lineHeight: 1.8, maxWidth: 500, marginBottom: 40 }}>
            Join thousands of Australian educators taking proactive steps to support student wellbeing
            before challenges become crises. Free for every school.
          </p>
          <a href="/events" style={{
            display: "inline-block",
            background: "#111", color: "#fff",
            padding: "18px 40px", borderRadius: 4,
            fontWeight: 700, fontSize: "1rem",
            textDecoration: "none", letterSpacing: "0.02em",
          }}>
            Register for Free Webinars →
          </a>
        </section>

      </main>
      <Footer />
    </div>
  );
}
