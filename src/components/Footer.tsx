export default function Footer() {
  return (
    <footer id="about">
      <div className="crisis-bar">
        <strong>If you or someone you know needs support:</strong> Beyond Blue 1300 22 4636 · Kids Helpline 1800 55 1800 · Lifeline 13 11 14
      </div>
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><span>Schools</span>Wellbeing.com.au</div>
          <p className="footer-brand-sub">
            A data-driven platform illuminating the mental health and wellbeing challenges facing Australian school children. Built on credible government and peer-reviewed sources.
          </p>
        </div>
        <div className="footer-col">
          <h4>Top Issues</h4>
          <a href="#issues">Anxiety &amp; Depression</a>
          <a href="#issues">Self-Harm &amp; Suicidality</a>
          <a href="#issues">Bullying</a>
          <a href="#issues">Cyberbullying</a>
          <a href="#issues">School Belonging</a>
          <a href="#issues">View all 15 →</a>
        </div>
        <div className="footer-col">
          <h4>Key Sources</h4>
          <a href="https://www.aihw.gov.au" target="_blank" rel="noopener noreferrer">AIHW.gov.au</a>
          <a href="https://www.esafety.gov.au" target="_blank" rel="noopener noreferrer">eSafety Commissioner</a>
          <a href="https://www.pc.gov.au" target="_blank" rel="noopener noreferrer">Productivity Commission</a>
          <a href="https://www.missionaustralia.com.au" target="_blank" rel="noopener noreferrer">Mission Australia</a>
          <a href="https://youngmindsmatter.thekids.org.au" target="_blank" rel="noopener noreferrer">Young Minds Matter</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 SchoolsWellbeing.com.au · For informational and advocacy purposes only. Not clinical advice.</p>
      </div>
    </footer>
  );
}
