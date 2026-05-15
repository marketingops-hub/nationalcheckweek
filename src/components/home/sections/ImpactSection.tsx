import { Users, BarChart3, Lightbulb, CheckCircle } from "lucide-react";

const B6 = "#29B8E8";

export function ImpactSection() {
  const stats = [
    { icon: Users, value: "15M", label: "Students", sub: "Supporting students across Australian schools through the initiative" },
    { icon: BarChart3, value: "1 in 7", label: "Children", sub: "Have a diagnosable mental disorder — most go undetected" },
    { icon: Lightbulb, value: "38%", label: "Bullying", sub: "Experienced bullying at school in the past 12 months" },
    { icon: CheckCircle, value: "24%", label: "Support", sub: "Supporting children across every state and territory" },
  ];
  
  return (
    <section className="home1-impact" style={{ padding: "5rem 0", background: "var(--color-bg-subtle)" }} data-testid="impact-section">
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <div className="section-header fade-up">
          <span className="section-eyebrow">Impact</span>
          <h2 className="section-h2">The Challenge We Face</h2>
          <p className="section-desc">Student wellbeing is at a critical juncture. Here&rsquo;s why action is needed now.</p>
        </div>
        <div className="home1-impact-grid">
          {stats.map((s, i) => (
            <div key={i} className={`home1-impact-card fade-up fade-up-delay-${i + 1}`}>
              <div className="home1-impact-icon"><s.icon size={22} color={B6} /></div>
              <div className="home1-impact-val">{s.value}</div>
              <div className="home1-impact-lbl">{s.label}</div>
              <p className="home1-impact-sub">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
