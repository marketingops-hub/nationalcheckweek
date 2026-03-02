export default function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="final-cta-inner">
        <div className="final-cta-tag">
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal-light)", display: "inline-block" }} />
          Take Action
        </div>

        <h2>
          Every week without data is a week a student<br />
          slips through the <em>cracks</em>
        </h2>

        <p>
          The issues on this monitor are not abstract statistics — they are children in classrooms right now. Schools that measure wellbeing systematically catch the warning signs weeks before crisis. Those that don&apos;t are flying blind.
        </p>

        <div className="final-cta-btns">
          <a
            href="https://www.lifeskillsgroup.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="final-cta-btn-primary"
          >
            See How Schools Measure Wellbeing
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </a>
          <a href="#map" className="final-cta-btn-secondary">
            Explore Your State →
          </a>
        </div>

        <div className="final-cta-trust">
          {[
            "AIHW · Mission Australia · RoGS 2026",
            "Data from peer-reviewed Australian sources",
            "Updated 2024–25",
            "Free to access · No sign-up required",
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
