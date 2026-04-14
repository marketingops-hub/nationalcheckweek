import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { AboutPageContent } from "@/types/cms/about";
import { DEFAULT_ABOUT_CONTENT } from "@/lib/cms/defaults/about";

export async function generateMetadata(): Promise<Metadata> {
  const sb = await createClient();
  const { data: page } = await sb
    .from("cms_pages")
    .select("meta_title, meta_description")
    .eq("slug", "about")
    .eq("published", true)
    .single();

  return {
    title: page?.meta_title || "About — National Check-in Week",
    description: page?.meta_description || "National Check-In Week was founded to ensure no child falls through the gaps — regardless of background, identity, or location. Learn about our mission, pillars, and the data driving this movement.",
  };
}

export default async function AboutPage() {
  const sb = await createClient();
  const { data: page } = await sb
    .from("cms_pages")
    .select("content")
    .eq("slug", "about")
    .eq("published", true)
    .single();

  let content: AboutPageContent = DEFAULT_ABOUT_CONTENT;

  // Try to parse CMS content if it exists and is in the new format
  if (page?.content) {
    try {
      const parsedContent = typeof page.content === 'string' 
        ? JSON.parse(page.content) 
        : page.content;
      
      // Check if it has the expected structure
      if (parsedContent.hero && parsedContent.mission && parsedContent.stats) {
        content = parsedContent;
      }
    } catch (error) {
      // If parsing fails, use default content
      console.error('Failed to parse About page content, using defaults:', error);
    }
  }

  const PILLARS = content.pillars;
  const STATS = content.stats.map(s => ({ num: s.number, label: s.label, source: s.source }));
  
  // Note: Using stable IDs from CMS data for React keys
  return (
    <>
      {/* ── Hero ── */}
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner" style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow-tag" style={{ margin: "0 auto 16px" }}>🏫 Our Mission</div>
          <h1 className="page-hero__title">
            {content.hero.title}
          </h1>
          <p className="page-hero__subtitle" style={{ margin: "0 auto" }}>
            {content.hero.subtitle}
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
              {content.mission.heading}
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-mid)", lineHeight: 1.8, marginBottom: 16 }}>
              {content.mission.paragraph1}
            </p>
            <p style={{ fontSize: "1.05rem", color: "var(--text-mid)", lineHeight: 1.8 }}>
              {content.mission.paragraph2}
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
            {content.statsConclusion}
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
        {/* HIDDEN: Our Story section - copy needs to be redone
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
        */}

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
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, marginBottom: 28, lineHeight: 1.3, color: "#ffffff" }}>
              {content.beliefs.heading}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              {content.beliefs.items.map((b) => (
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
            {content.cta.heading}
          </h3>
          <div className="prevention-bridge__body">
            <p>
              {content.cta.text}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
            <Link href="/issues" className="prevention-bridge__cta">
              Explore the Issues
            </Link>
            <Link href="https://nationalcheckinweek.com/register" className="prevention-bridge__cta">
              Register Your School
            </Link>
          </div>
        </div>

      </main>
    </>
  );
}
