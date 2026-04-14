const stats = [
  { num: "Suicide", label: "is the leading cause of death for Australians aged 15–24" },
  { num: "1 in 7",  label: "children has a diagnosable mental disorder — most go undetected" },
  { num: "72%",     label: "of all lifetime mental health conditions begin before age 25" },
  { num: "8×",      label: "more cost-effective to intervene early than treat a crisis later" },
];

export default function Hero() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">National Check-in Week · Australia 2026</div>

          <h1>
            Every student deserves to be
            <span className="word-cycle-wrap">
              <span className="word-cycle">
                <span>wellbeing</span>
                <span>readiness</span>
                <span>supported</span>
              </span>
            </span>
            checked in on
          </h1>

          <p className="hero-sub">
            National Check-in Week is a FREE initiative giving Australian school leaders the tools, data, and professional learning they need to support every student — before challenges become crises.
          </p>

          <div className="hero-cta-row">
            <a href="#about" className="hero-btn-primary">Register for Free Webinars</a>
            <a href="#issues" className="hero-btn-secondary">Explore the Issues &nbsp;→</a>
          </div>
        </div>
      </section>

      <section className="hero-stats-section">
        <div className="hero-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-num">{s.num}</div>
              <p className="hero-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
