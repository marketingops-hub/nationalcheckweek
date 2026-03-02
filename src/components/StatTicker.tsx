const TICKS = [
  { num: "~580K", desc: "children aged 4–17 with a diagnosable mental disorder", src: "Young Minds Matter, 2013–14" },
  { num: "38%",   desc: "experienced cyberbullying in the past 12 months", src: "eSafety Commissioner" },
  { num: "46,000+", desc: "bullying incidents recorded in Queensland schools in 2023", src: "QLD Auditor-General, 2024–25" },
  { num: "25%",   desc: "of 12–13 year olds don't meet sleep guidelines on school nights", src: "AIHW Sleep Report" },
  { num: "1 in 5", desc: "young Australians felt lonely most or all of the time", src: "Mission Australia, 2024" },
  { num: "57%",   desc: "average attendance in very remote schools vs 93% in major cities", src: "RoGS 2026" },
];

export default function StatTicker() {
  return (
    <div className="ticker">
      {TICKS.map((t) => (
        <div key={t.desc} className="ticker-item">
          <div className="ticker-num">{t.num}</div>
          <div className="ticker-desc">{t.desc}</div>
          <div className="ticker-src">{t.src}</div>
        </div>
      ))}
    </div>
  );
}
