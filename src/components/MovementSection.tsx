export default function MovementSection() {
  const pillars = [
    "Embed emotional literacy and self-regulation across entire school communities",
    "Champion evidence-based, data-informed wellbeing strategies",
    "Elevate student voice as a key driver of policy and practice",
    "Give schools real-time, actionable data to measure wellbeing programs, detect patterns, deploy precise interventions, and drive proactive preventative strategies",
  ];

  return (
    <section className="movement-section">
      <div className="movement-inner">
        {/* Left column */}
        <div className="movement-left">
          <p className="movement-eyebrow">If not now, when?</p>
          <h2 className="movement-heading">
            Unite for a New Era in<br />Student Wellbeing
          </h2>
          <p className="movement-body">
            Australia is at a critical crossroads. Two in five young people are living with a mental
            health condition, yet many schools still lack the tools, data, and professional learning
            needed to act early. National Check-In Week 2026 is more than a campaign — it&apos;s a
            national movement to elevate student voice, challenge outdated, siloed wellbeing
            practices, and drive systemic, generational change.
          </p>
          <p className="movement-free">
            All events, tools and resources are <strong>free</strong> for every school and family.
          </p>
          <a href="/events" className="movement-cta">Register for Free →</a>
        </div>

        {/* Right column */}
        <div className="movement-right">
          <p className="movement-why">Why It&apos;s Time to Lead</p>
          <p className="movement-why-sub">
            We&apos;re calling on school leaders, education departments, and policymakers to help
            shape a proactive future. Join us to:
          </p>
          <ul className="movement-pillars">
            {pillars.map((p, i) => (
              <li key={i} className="movement-pillar">
                <span className="movement-pillar-dot" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
