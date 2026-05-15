export default function LifeSkillsSection() {
  return (
    <section className="lsg-section" id="prevention">
      <div className="lsg-layout">
        {/* LEFT: Copy */}
        <div className="lsg-content">
          <div className="lsg-eyebrow">From Data to Prevention</div>
          <h2 className="lsg-headline">
            What if we could see the problem <em>coming</em>?
          </h2>
          <p className="lsg-body">
            The issues on this page — anxiety, disengagement, bullying, sleep deprivation, school avoidance — rarely appear overnight. They build slowly, invisibly, until they become a crisis. The tragedy is that most were detectable weeks or months earlier.
          </p>
          <p className="lsg-body">
            Whole-school wellbeing programmes that systematically measure student readiness to learn give educators something powerful: early signal. When a student&apos;s emotional data shifts, teachers can respond before the decline becomes entrenched — addressing attendance, referral to support, or a simple check-in conversation.
          </p>

          <div className="lsg-stats">
            <div className="lsg-stat-box">
              <div className="lsg-stat-num">Early</div>
              <div className="lsg-stat-label">intervention is up to 8× more cost-effective than late-stage treatment</div>
            </div>
            <div className="lsg-stat-box">
              <div className="lsg-stat-num">1 in 7</div>
              <div className="lsg-stat-label">students with a mental disorder receives any professional help at school</div>
            </div>
            <div className="lsg-stat-box">
              <div className="lsg-stat-num">Whole</div>
              <div className="lsg-stat-label">school approaches are the most effective model for student wellbeing — DET, 2024</div>
            </div>
            <div className="lsg-stat-box">
              <div className="lsg-stat-num">Data</div>
              <div className="lsg-stat-label">that measures emotional readiness to learn predicts academic outcomes — Hattie, 2023</div>
            </div>
          </div>

          <div className="lsg-cta-row">
            <a
              href="https://www.lifeskillsgroup.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="lsg-cta"
            >
              See Life Skills GO in Action
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </a>
            <a
              href="#research"
              className="lsg-cta-ghost"
            >
              View the Evidence
            </a>
          </div>
          <p className="lsg-disclaimer">
            Life Skills GO is an evidence-based wellbeing measurement and resource platform designed in collaboration with Australian educators. It is used in schools across Australia to collect emotion and wellbeing data, measure student readiness to learn, and deliver curriculum-aligned resources — supporting both whole-school and individual student wellbeing strategies.
          </p>
        </div>

        {/* RIGHT: Visual card */}
        <div className="lsg-visual">
          <div className="lsg-card">
            <div className="lsg-card-title">How data-led wellbeing works</div>
            <div className="lsg-flow">

              <div className="lsg-flow-step active">
                <div className="lsg-flow-icon blue">📊</div>
                <div>
                  <div className="lsg-flow-text-title">Measure student wellbeing regularly</div>
                  <div className="lsg-flow-text-sub">Short check-ins capture emotional readiness to learn across the whole school</div>
                </div>
              </div>

              <div className="lsg-flow-arrow">↓</div>

              <div className="lsg-flow-step">
                <div className="lsg-flow-icon amber">🔍</div>
                <div>
                  <div className="lsg-flow-text-title">Identify patterns before they escalate</div>
                  <div className="lsg-flow-text-sub">Anxiety signals, disengagement trends, and social isolation become visible early</div>
                </div>
              </div>

              <div className="lsg-flow-arrow">↓</div>

              <div className="lsg-flow-step">
                <div className="lsg-flow-icon green">🎯</div>
                <div>
                  <div className="lsg-flow-text-title">Respond with evidence-based resources</div>
                  <div className="lsg-flow-text-sub">Curriculum-aligned activities, targeted support, and staff action — at the right time</div>
                </div>
              </div>

              <div className="lsg-flow-arrow">↓</div>

              <div className="lsg-flow-step">
                <div className="lsg-flow-icon blue">✅</div>
                <div>
                  <div className="lsg-flow-text-title">Track impact and report with confidence</div>
                  <div className="lsg-flow-text-sub">Demonstrate whole-school wellbeing improvement to parents, boards and regulators</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
