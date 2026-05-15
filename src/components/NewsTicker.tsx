const ITEMS = [
  "1 in 7 children has a diagnosable mental disorder — most go undetected",
  "580,000+ Australian children aged 4–17 have a diagnosable mental disorder",
  "38% of young Australians experienced cyberbullying in the past 12 months · eSafety 2024",
  "45,000+ bullying incidents reported in Queensland schools annually",
  "72% of lifetime mental health conditions begin before age 25",
  "Suicide is the leading cause of death for Australians aged 15–24",
  "8× more cost-effective to intervene early than treat a crisis later · Productivity Commission",
  "1 in 5 young Australians felt lonely most or all of the time · Mission Australia 2024",
  "65% of LGBTQ+ students report feeling unsafe at school · Writing Themselves In 4",
];

export default function NewsTicker() {
  const items = [...ITEMS, ...ITEMS];

  return (
    <div className="news-ticker" aria-label="Wellbeing statistics ticker">
      <div className="news-ticker-label">ALERT</div>
      <div className="news-ticker-viewport">
        <div className="news-ticker-track">
          {items.map((text, i) => (
            <span key={i} className="news-ticker-item">{text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
