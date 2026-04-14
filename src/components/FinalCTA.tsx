export default function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="final-cta-inner">
        <div className="final-cta-tag">
          <span className="final-cta-tag-dot" aria-hidden="true" />
          Join the Movement
        </div>

        <h2>
          No child should fall through the<br />
          <em>gaps</em>
        </h2>

        <p>
          National Check-in Week 2026 is more than a campaign — it&apos;s a national movement. Join thousands of Australian educators taking proactive steps to support student wellbeing before challenges become crises.
        </p>

        <div className="final-cta-btns">
          <a
            href="#about"
            className="final-cta-btn-primary"
          >
            Register for Free Webinars
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <a href="#issues" className="final-cta-btn-secondary">
            Explore the Issues →
          </a>
        </div>

        <div className="final-cta-trust">
          {[
            "FREE initiative for Australian schools",
            "Expert-led webinars &amp; panels",
            "Real-time wellbeing data tools",
            "No cost · Open to all schools",
          ].map(item => (
            <div key={item} className="final-cta-trust-item">
              <span className="final-cta-trust-dot" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
