export default function Hero() {
  const stats = [
    { num: "13.9", suffix: "%", label: "of children aged 4–17 have a mental disorder" },
    { num: "1", suffix: " in 5", label: "teens report high psychological distress" },
    { num: "53", suffix: "%", label: "of 10–17 yr olds experienced cyberbullying" },
    { num: "50", suffix: "%", label: "of 16–17 year olds miss sleep guidelines" },
  ];

  return (
    <section className="hero">
      <div className="hero-tag">Australian Schools Wellbeing Monitor · 2024–25</div>
      <h1>
        When School<br />Becomes a<br />
        <em>Crisis Zone</em>
      </h1>
      <p className="hero-sub">
        One in seven Australian children lives with a mental disorder. From remote classrooms to inner-city schools, a silent epidemic is reshaping how our children learn, grow, and belong. This is the data.
      </p>
      <div className="hero-stats">
        {stats.map((s) => (
          <div key={s.label} className="hero-stat">
            <div className="hero-stat-num">
              {s.num}<span>{s.suffix}</span>
            </div>
            <div className="hero-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
