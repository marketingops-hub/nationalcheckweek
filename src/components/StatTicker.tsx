const TICKS = [
  { num: "~580K",   desc: "children aged 4–17 with a diagnosable mental disorder", src: "Young Minds Matter, 2013–14" },
  { num: "38%",     desc: "of young Australians experienced cyberbullying in the past 12 months", src: "eSafety Commissioner, 2024" },
  { num: "46,000+", desc: "bullying incidents recorded in Queensland schools in 2023 alone", src: "QLD Auditor-General, 2024–25" },
  { num: "25%",     desc: "of 12–13 year olds don't meet sleep guidelines on school nights", src: "AIHW Sleep Report" },
  { num: "1 in 5",  desc: "young Australians felt lonely most or all of the time", src: "Mission Australia, 2024" },
  { num: "57%",     desc: "average attendance in very remote schools vs 93% in major cities", src: "RoGS 2026" },
  { num: "72%",     desc: "of mental health conditions emerge before age 25 — most before 14", src: "Beyond Blue / AIHW" },
  { num: "8×",      desc: "more cost-effective: early intervention vs. late-stage treatment", src: "Productivity Commission, 2020" },
  { num: "40%",     desc: "of school refusal cases are linked to anxiety disorders", src: "CAMHS Australia" },
  { num: "1 in 14", desc: "Australian children aged 4–17 has ADHD, affecting learning daily", src: "AIHW, 2023" },
  { num: "65%",     desc: "of LGBTQ+ students report feeling unsafe at school", src: "Writing Themselves In 4, 2021" },
  { num: "3×",      desc: "higher risk of mental illness in children experiencing food insecurity", src: "ACOSS Poverty Report, 2024" },
];

export default function StatTicker() {
  return (
    <div className="ticker">
      {TICKS.map((t) => (
        <div key={t.desc} className="ticker-item">
          <div className="ticker-num">{t.num}</div>
          <div className="ticker-divider" aria-hidden="true" />
          <div className="ticker-desc">{t.desc}</div>
        </div>
      ))}
    </div>
  );
}
