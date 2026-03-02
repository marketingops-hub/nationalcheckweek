const THEMES = [
  {
    id: "mental-health",
    icon: "🧠",
    title: "Mental Health Prevalence",
    color: "theme-red",
    findings: [
      { stat: "13.9%", detail: "of Australian children aged 4–17 meet diagnostic criteria for a mental disorder — roughly 580,000 children nationally.", src: "Young Minds Matter, 2013–14" },
      { stat: "1 in 5", detail: "adolescents experience high or very high psychological distress before finishing secondary school.", src: "Mission Australia Youth Survey, 2024" },
      { stat: "72%", detail: "of all lifetime mental health conditions first emerge before age 25 — and most before age 14.", src: "Beyond Blue / AIHW, 2023" },
      { stat: "6.9%", detail: "of children have an anxiety disorder — the most common diagnosis, yet the least likely to receive treatment.", src: "Young Minds Matter, 2013–14" },
      { stat: "2.8%", detail: "of children aged 4–17 have major depressive disorder, rising sharply in the 12–17 age bracket.", src: "AIHW, 2023" },
      { stat: "1 in 14", detail: "Australian children have ADHD, directly impacting attention, behaviour and academic outcomes every day.", src: "AIHW, 2023" },
    ],
  },
  {
    id: "attendance",
    icon: "🏫",
    title: "Attendance & Disengagement",
    color: "theme-amber",
    findings: [
      { stat: "57%", detail: "average attendance rate in very remote Australian schools, compared to 93% in major cities — a 36-point gap.", src: "RoGS 2026, Productivity Commission" },
      { stat: "40%", detail: "of school refusal cases have an identified anxiety disorder as the primary driver.", src: "CAMHS Australia" },
      { stat: "1 in 5", detail: "students is chronically absent (missing 10%+ of school days), concentrated in low-SES and regional communities.", src: "AEDC National Report, 2024" },
      { stat: "21%", detail: "of Year 9 students report not feeling connected to their school — a key predictor of dropout.", src: "Tell Them From Me, 2023" },
      { stat: "$25K", detail: "estimated lifetime earnings cost per student of failing to complete Year 12, compounding with mental health challenges.", src: "Mitchell Institute, 2023" },
      { stat: "3×", detail: "higher unemployment risk for young people who leave school early without a certificate.", src: "ABS Education & Employment, 2024" },
    ],
  },
  {
    id: "bullying",
    icon: "🛡️",
    title: "Bullying & Cyberbullying",
    color: "theme-orange",
    findings: [
      { stat: "27%", detail: "of Australian students aged 8–17 reported being bullied in the previous 12 months.", src: "National Centre Against Bullying, 2023" },
      { stat: "38%", detail: "of young Australians experienced cyberbullying in the past 12 months, with rates highest in the 12–15 age group.", src: "eSafety Commissioner, 2024" },
      { stat: "46K+", detail: "bullying incidents formally recorded in Queensland schools in 2023 — and these are only reported cases.", src: "QLD Auditor-General, 2024–25" },
      { stat: "2.4×", detail: "higher likelihood of self-harm in adolescents who experience repeated bullying vs. those who don't.", src: "AIHW Youth Self-Harm Atlas" },
      { stat: "55%", detail: "of students who are bullied do not tell a teacher — most tell no adult at school.", src: "Alannah & Madeline Foundation, 2023" },
      { stat: "1 in 3", detail: "Australian parents reports their child has been the target of cyberbullying, often not discovered until harm is done.", src: "eSafety Commissioner Parent Survey, 2024" },
    ],
  },
  {
    id: "sleep-screens",
    icon: "📱",
    title: "Sleep, Screens & Technology",
    color: "theme-blue",
    findings: [
      { stat: "50%", detail: "of 16–17 year olds fail to meet the national sleep guidelines of 8–10 hours per night on school nights.", src: "AIHW Sleep Report, 2023" },
      { stat: "25%", detail: "of 12–13 year olds are already not meeting minimum sleep requirements — the deficit starts younger than expected.", src: "AIHW Sleep Report, 2023" },
      { stat: "4.4 hrs", detail: "average daily recreational screen time for Australian adolescents aged 12–17, much of it at night.", src: "Black Dog Institute Teens & Screens, 2024" },
      { stat: "3×", detail: "higher rates of depressive symptoms in teens using social media for 5+ hours per day vs. less than 1 hour.", src: "Black Dog Institute, 2024" },
      { stat: "70%", detail: "of teens report using their phone in bed after lights out — directly degrading sleep quality and next-day attention.", src: "Mission Australia Youth Survey, 2024" },
      { stat: "1 hr less", detail: "sleep per night correlates with a 25% drop in emotional regulation capacity and heightened impulsivity in adolescents.", src: "Sleep Health Foundation Australia, 2023" },
    ],
  },
  {
    id: "inequality",
    icon: "⚖️",
    title: "Inequality & Vulnerable Groups",
    color: "theme-purple",
    findings: [
      { stat: "65%", detail: "of LGBTQ+ students report feeling unsafe at school, with 44% experiencing verbal harassment in the past year.", src: "Writing Themselves In 4, 2021" },
      { stat: "3×", detail: "higher risk of a mental health condition in children living in households experiencing food insecurity.", src: "ACOSS Poverty Report, 2024" },
      { stat: "2×", detail: "higher rates of emotional and behavioural difficulties in Aboriginal and Torres Strait Islander children aged 4–11.", src: "AIHW Indigenous Child Health, 2023" },
      { stat: "42%", detail: "of children in out-of-home care meet criteria for a mental health disorder — 3× the general population rate.", src: "AIHW Child Protection Australia, 2023" },
      { stat: "1 in 4", detail: "children with disability experiences bullying at school, significantly higher than the general student population.", src: "AIHW Disability in Australia, 2023" },
      { stat: "58%", detail: "of newly arrived migrant and refugee students experience significant adjustment stress in their first school year.", src: "AMES Australia, 2023" },
    ],
  },
  {
    id: "selfharm",
    icon: "🆘",
    title: "Self-Harm & Crisis",
    color: "theme-red-dark",
    findings: [
      { stat: "1 in 16", detail: "Australians aged 16–24 reported self-harming in the previous 12 months — many are current secondary students.", src: "AIHW Youth Self-Harm Atlas, 2023" },
      { stat: "3,200+", detail: "young Australians aged 15–24 are hospitalised for intentional self-harm each year.", src: "AIHW Hospital Data, 2022–23" },
      { stat: "Suicide", detail: "is the leading cause of death for Australians aged 15–24, accounting for 36% of all deaths in that age group.", src: "ABS Causes of Death, 2023" },
      { stat: "76%", detail: "of young people who self-harm do not seek professional help — most manage alone or rely on peers.", src: "headspace National Youth Mental Health Survey, 2023" },
      { stat: "2.4×", detail: "higher self-harm rate in very remote communities compared to major cities, driven by access and isolation.", src: "AIHW Youth Self-Harm Atlas" },
      { stat: "Girls", detail: "aged 15–19 are hospitalised for self-harm at 3× the rate of boys the same age, though boys have higher suicide rates.", src: "AIHW, 2023" },
    ],
  },
];

export default function ResearchSection() {
  return (
    <section className="section" id="research" style={{ background: "var(--white)" }}>
      <div className="section-tag">National Research Overview</div>
      <h2>What the Evidence Shows</h2>
      <p className="section-lead">
        A synthesis of the most significant Australian research on student wellbeing — across mental health, attendance, safety, technology, inequality, and crisis. Every figure is sourced from peer-reviewed studies or government data collections.
      </p>

      <div className="research-grid">
        {THEMES.map((theme) => (
          <div key={theme.id} className={`research-card ${theme.color}`}>
            <div className="research-card-header">
              <span className="research-icon">{theme.icon}</span>
              <h3 className="research-card-title">{theme.title}</h3>
            </div>
            <div className="research-findings">
              {theme.findings.map((f) => (
                <div key={f.stat + f.src} className="research-finding">
                  <div className="research-finding-stat">{f.stat}</div>
                  <div className="research-finding-body">
                    <p className="research-finding-detail">{f.detail}</p>
                    <span className="research-finding-src">↗ {f.src}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="research-note">
        <strong>Note on data currency:</strong> Australian national prevalence data for child mental health is primarily drawn from the 2013–14 Young Minds Matter survey — the most recent nationally representative study. The AIHW has flagged a new national survey as a priority. Regional, self-harm, and attendance data reflects the most recent available collections (2022–24).
      </div>
    </section>
  );
}
