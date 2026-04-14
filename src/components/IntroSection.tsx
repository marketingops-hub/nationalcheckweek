export default function IntroSection() {
  return (
    <section className="intro-section">
      <div className="intro-inner">

        {/* Block 1 — What NCIW offers */}
        <div className="intro-block intro-block-primary">
          <div className="intro-tag">
            <span className="intro-tag-dot" />
            Free Initiative · Australian Schools
          </div>
          <p className="intro-lead">
            National Check-In Week (NCIW) is a transformative, <strong>FREE</strong> initiative designed to tackle the growing
            student wellbeing crisis in Australian schools. With rising mental health challenges and increasing pressures on
            students, it&rsquo;s crucial to take proactive and preventative measures. NCIW provides school leaders with the
            tools to bridge gaps in traditional wellbeing assessments, offering real-time actionable data on student
            readiness, wellbeing trends, and whole school reporting.
          </p>
          <p className="intro-body">
            Register to join our free webinars run by experts in their field, attend our panels, and use the free resources
            curated from our partners to help your whole school community thrive. This week empowers student voices, helps
            develop emotional literacy, self-regulation, and resilience, while giving educators actionable real-time insights
            to create a supportive, inclusive environment.
          </p>
          <p className="intro-body intro-body-em">
            By engaging with NCIW, you&rsquo;ll be contributing to a collective effort to create a positive change in how we
            support student wellbeing in schools — and ensure <strong>no child falls through the gaps.</strong>
          </p>
        </div>

        {/* Block 2 — What is NCIW */}
        <div className="intro-block intro-block-secondary">
          <h2 className="intro-h2">What is National Check-In Week?</h2>
          <p className="intro-body">
            National Check-In Week (NCIW) was founded with a clear mission: to ensure that <strong>no child falls through
            the gaps</strong> — regardless of their background, identity, or location. Australian schools are at a critical
            crossroads, yet many still lack the tools, data, and professional learning needed to act early.
          </p>
          <p className="intro-body">
            National Check-In Week 2026 is more than a campaign — it&rsquo;s a <strong>national movement</strong> to elevate
            student voices, challenge outdated and siloed wellbeing practices, reduce educator administration, and drive
            systemic, generational change.
          </p>
          <div className="intro-pillars">
            {[
              { icon: "🎙️", text: "Elevate student voices" },
              { icon: "📊", text: "Real-time wellbeing data" },
              { icon: "🎓", text: "Expert-led free webinars" },
              { icon: "🤝", text: "Whole-school community resources" },
            ].map((p) => (
              <div key={p.text} className="intro-pillar">
                <span className="intro-pillar-icon">{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
