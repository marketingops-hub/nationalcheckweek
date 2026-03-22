import Link from "next/link";

export const metadata = {
  title: "About — National Check-in Week",
  description:
    "National Check-In Week was founded to ensure no child falls through the gaps — regardless of background, identity, or location. Learn about our mission, pillars, and the data driving this movement.",
};

const PILLARS = [
  {
    icon: "🌉",
    title: "Bridging Gaps",
    body: "National Check-In Week addresses critical gaps in student wellbeing assessments. Traditional tools often provide only reactive insights into student wellbeing, leaving silent struggles unchecked. Our initiative offers real-time, actionable triangulated data on school and student wellbeing, enabling early intervention and fostering a preventative approach rather than a reactive one.",
  },
  {
    icon: "🎙️",
    title: "Elevating Voices",
    body: "At the heart of this initiative is Student Voice. We create a safe space where students can identify, communicate, and learn to self-regulate their emotions. By empowering students to understand and express their feelings, we reduce the stigma surrounding emotional expression. Through daily wellbeing check-ins, students are given the opportunity to voice their experiences, helping to create a more inclusive, connected, and supportive school environment where every student is seen and heard.",
  },
  {
    icon: "💙",
    title: "Supporting Student Wellbeing",
    body: "National Check-In Week not only raises awareness of the importance of student wellbeing, but also highlights the need for ongoing, effective support and access to resources that foster emotional growth. Through this week, students develop essential skills such as self-regulation, resilience, and emotional awareness — skills crucial for managing stress, building strong relationships, and promoting overall academic success.",
  },
];

const STATS = [
  { num: "1 in 5", label: "children reported feeling more down, scared or worried than they used to", source: "Australian Human Rights Commission" },
  { num: "53%", label: "of children were negatively affected by the pandemic", source: "RCH National Child Health Poll" },
  { num: "Highest risk", label: "young Australians still face the worst mental and wellbeing effects of Covid-19", source: "Prof Nicholas Biddle, The Guardian" },
];

const TIMELINE = [
  { year: "2021", text: "National Check-In Week concept developed in response to surging youth mental health concerns during the pandemic." },
  { year: "2022", text: "First national pilot launched with schools across multiple Australian states." },
  { year: "2023", text: "Program expanded, reaching hundreds of schools and hundreds of thousands of student check-ins." },
  { year: "2024", text: "Ambassador network established to champion student wellbeing at the community level." },
  { year: "2025", text: "Launched this data platform to make school wellbeing data visible, searchable, and actionable." },
  { year: "2026", text: "Continuing to grow — with more schools, more data, and a clearer picture of Australian student wellbeing than ever before." },
];

export default function AboutPage() {
  return (
    <>
      {/* ── Hero ── */}
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner" style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow-tag" style={{ margin: "0 auto 16px" }}>🏫 Our Mission</div>
          <h1 className="page-hero__title">
            About National Check-In Week
          </h1>
          <p className="page-hero__subtitle" style={{ margin: "0 auto" }}>
            Founded with a clear mission: to ensure that no child falls through the gaps —
            regardless of their background, identity, or location.
          </p>
        </div>
      </div>

      <main id="main-content" className="inner-content">

        {/* ── Mission Statement ── */}
        <section style={{ marginBottom: 64 }}>
          <div style={{
            background: "var(--primary-light)",
            border: "1px solid var(--primary)",
            borderRadius: "var(--radius-lg)",
            padding: "40px 48px",
          }}>
            <div className="eyebrow-tag">Who We Are</div>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "var(--dark)", marginBottom: 20, fontWeight: 800, lineHeight: 1.3 }}>
              Australian schools are under pressure — and students are struggling silently
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-mid)", lineHeight: 1.8, marginBottom: 16 }}>
              National Check-In Week (NCIW) was founded with a clear mission: to ensure that no child falls
              through the gaps — regardless of their background, identity, or location. We exist to put
              real-time wellbeing data in the hands of the people who can act on it: school leaders,
              counsellors, and teachers.
            </p>
            <p style={{ fontSize: "1.05rem", color: "var(--text-mid)", lineHeight: 1.8 }}>
              Every year, for one dedicated week, schools across Australia pause and ask their students
              a simple but profound question: <em>How are you, really?</em> The answers shape interventions,
              policies, and support systems that can change — and save — young lives.
            </p>
          </div>
        </section>

        {/* ── Why We Started ── */}
        <section style={{ marginBottom: 64 }}>
          <div className="eyebrow-tag">The Evidence</div>
          <h2 className="section-heading" style={{ marginBottom: 32 }}>
            Why We Started National Check-In Week
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {STATS.map((s) => (
              <div key={s.label} style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "28px 24px",
                boxShadow: "var(--shadow-card)",
              }}>
                <div style={{
                  fontSize: "2.2rem", fontWeight: 900,
                  color: "var(--accent)",
                  fontFamily: "var(--font-display)",
                  marginBottom: 10,
                  lineHeight: 1,
                }}>
                  {s.num}
                </div>
                <p style={{ fontSize: "0.95rem", color: "var(--text-mid)", lineHeight: 1.6, marginBottom: 12 }}>
                  {s.label}
                </p>
                <div style={{
                  fontSize: "0.75rem", fontWeight: 700,
                  color: "var(--text-light)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>
                  {s.source}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: "0.95rem", color: "var(--text-mid)", lineHeight: 1.7 }}>
            These aren&apos;t abstract statistics. They represent children in classrooms across Australia
            who are struggling without the data infrastructure that could identify them early and connect
            them to support. National Check-In Week exists to change that.
          </p>
        </section>

        {/* ── The Pillars ── */}
        <section style={{ marginBottom: 64 }}>
          <div className="eyebrow-tag">How We Work</div>
          <h2 className="section-heading" style={{ marginBottom: 32 }}>
            The Pillars of National Check-In Week
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {PILLARS.map((p, i) => (
              <div key={p.title} style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr",
                gap: 24,
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "28px 32px",
                boxShadow: "var(--shadow-card)",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: 56, height: 56,
                  background: "var(--primary-light)",
                  borderRadius: "var(--radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem",
                  flexShrink: 0,
                }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "var(--primary)", marginBottom: 8,
                  }}>
                    Pillar {i + 1}
                  </div>
                  <h3 style={{
                    fontSize: "1.15rem", fontWeight: 800,
                    color: "var(--dark)", marginBottom: 12,
                  }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-mid)", lineHeight: 1.75 }}>
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Our Journey ── */}
        <section style={{ marginBottom: 64 }}>
          <div className="eyebrow-tag">Our Story</div>
          <h2 className="section-heading" style={{ marginBottom: 32 }}>
            How We Got Here
          </h2>
          <div style={{ position: "relative", paddingLeft: 32 }}>
            <div style={{
              position: "absolute", left: 10, top: 8, bottom: 8,
              width: 2, background: "var(--border)",
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {TIMELINE.map((t) => (
                <div key={t.year} style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: -30, top: 4,
                    width: 12, height: 12, borderRadius: "50%",
                    background: "var(--primary)",
                    border: "2px solid var(--white)",
                    boxShadow: "0 0 0 2px var(--primary)",
                  }} />
                  <div style={{
                    fontSize: "0.8rem", fontWeight: 800,
                    color: "var(--primary)", letterSpacing: "0.06em",
                    textTransform: "uppercase", marginBottom: 6,
                  }}>
                    {t.year}
                  </div>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-mid)", lineHeight: 1.7 }}>
                    {t.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What We Believe ── */}
        <section style={{ marginBottom: 64 }}>
          <div style={{
            background: "linear-gradient(135deg, var(--dark) 0%, #1a2a4a 100%)",
            borderRadius: "var(--radius-lg)",
            padding: "48px",
            color: "#fff",
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 12 }}>
              What We Believe
            </div>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, marginBottom: 28, lineHeight: 1.3 }}>
              Every student deserves to be seen
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              {[
                { icon: "📊", text: "Data without action is noise. Action without data is guesswork." },
                { icon: "🔒", text: "Student privacy and trust are non-negotiable — always." },
                { icon: "🌐", text: "Wellbeing disparities are solvable with the right information." },
                { icon: "🤝", text: "Schools, families, and communities are strongest when working together." },
              ].map((b) => (
                <div key={b.text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{b.icon}</span>
                  <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.65 }}>
                    {b.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="prevention-bridge">
          <div className="eyebrow-tag">Get Involved</div>
          <h3 className="prevention-bridge__heading">
            Ready to make student wellbeing visible at your school?
          </h3>
          <div className="prevention-bridge__body">
            <p>
              National Check-In Week is free for schools to participate in. Register your school today
              and join thousands of educators across Australia who are taking student wellbeing seriously.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
            <a href="https://nationalcheckinweek.com/register/" target="_blank" rel="noopener noreferrer" className="prevention-bridge__cta">
              Register Your School →
            </a>
            <Link href="/issues" className="prevention-bridge__cta" style={{ background: "transparent", border: "2px solid var(--primary)", color: "var(--primary)" }}>
              Explore the Issues
            </Link>
          </div>
        </div>

      </main>
    </>
  );
}
