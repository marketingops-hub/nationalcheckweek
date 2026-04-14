import { BarChart3, Lightbulb, ClipboardCheck, Users } from "lucide-react";

export function WhyMattersSection() {
  const items = [
    { Icon: BarChart3, title: "Growing Challenges", desc: "Growing challenges in their environment, including changes and pressure in academic needs and connection lags." },
    { Icon: Lightbulb, title: "Elevated Impact Needed", desc: "Elevated impact needed to counteract increasing pressure on environments and students, helping to overcome challenges." },
    { Icon: ClipboardCheck, title: "Year of the Data", desc: "This year of data will provide insights needed to improve student wellbeing in early years as the foundation of the data." },
    { Icon: Users, title: "Student Voice at the Centre", desc: "Student voice is incorporated into the centre of planning, ensuring their voice is a priority in your strategy." },
  ];
  
  return (
    <section className="home1-why" style={{ padding: "5rem 0" }} data-testid="why-matters-section">
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <div className="section-header fade-up">
          <span className="section-eyebrow">Why This Matters</span>
          <h2 className="section-h2">Creating Lasting Change</h2>
          <p className="section-desc">Four key reasons why this initiative is critical for Australian schools.</p>
        </div>
        <div className="home1-why-grid">
          {items.map((item, i) => (
            <div key={i} className={`home1-why-item fade-up fade-up-delay-${(i % 2) + 1}`}>
              <div className="home1-why-icon"><item.Icon /></div>
              <div>
                <h3 className="home1-why-title">{item.title}</h3>
                <p className="home1-why-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
