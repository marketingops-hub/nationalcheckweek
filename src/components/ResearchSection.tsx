import themesData from "@/lib/data/research-themes.json";

interface Finding { stat: string; detail: string; src: string; }
interface Theme { id: string; icon: string; title: string; color: string; findings: Finding[]; }

const THEMES = themesData as Theme[];

export default function ResearchSection() {
  return (
    <section className="section" id="research">
      <div className="section-inner">
      <div className="section-tag">National Research Overview</div>
      <h2>What the Evidence Shows</h2>
      <p className="section-lead">
        A synthesis of the most significant Australian research on student wellbeing — across mental health, attendance, safety, technology, inequality, and crisis. Every figure is sourced from peer-reviewed studies or government data collections.
      </p>

      <div className="research-grid">
        {THEMES.map((theme) => (
          <div key={theme.id} className={`research-card ${theme.color}`}>
            <div className="research-card-header">
              <span className="research-icon" aria-hidden="true">{theme.icon}</span>
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
      </div>
    </section>
  );
}
