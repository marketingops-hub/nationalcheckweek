export default function Footer() {
  return (
    <footer id="about">
      <div className="crisis-bar">
        <strong>If you or someone you know needs support:</strong> Beyond Blue 1300 22 4636 · Kids Helpline 1800 55 1800 · Lifeline 13 11 14
      </div>
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><span>National</span> Check-in Week</div>
          <p className="footer-brand-sub">
            A FREE national initiative empowering Australian school leaders with real-time student wellbeing data, expert webinars, and resources to ensure no child falls through the gaps.
          </p>
        </div>
        <div className="footer-col">
          <h4>Top Issues</h4>
          <ul className="footer-list">
            <li><a href="/issues/anxiety-depression">Anxiety &amp; Depression</a></li>
            <li><a href="/issues/self-harm-suicidality">Self-Harm &amp; Suicidality</a></li>
            <li><a href="/issues/bullying">Bullying</a></li>
            <li><a href="/issues/cyberbullying">Cyberbullying</a></li>
            <li><a href="/issues/school-belonging">School Belonging</a></li>
            <li><a href="/issues">View all issues →</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Key Sources</h4>
          <ul className="footer-list">
            <li><a href="https://www.aihw.gov.au" target="_blank" rel="noopener noreferrer">AIHW.gov.au</a></li>
            <li><a href="https://www.esafety.gov.au" target="_blank" rel="noopener noreferrer">eSafety Commissioner</a></li>
            <li><a href="https://www.pc.gov.au" target="_blank" rel="noopener noreferrer">Productivity Commission</a></li>
            <li><a href="https://www.missionaustralia.com.au" target="_blank" rel="noopener noreferrer">Mission Australia</a></li>
            <li><a href="https://youngmindsmatter.thekids.org.au" target="_blank" rel="noopener noreferrer">Young Minds Matter</a></li>
            <li><a href="/sources"><strong>All sources &amp; references →</strong></a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Accountability</h4>
          <ul className="footer-list">
            <li><a href="/events">Events</a></li>
            <li><a href="/sources">Sources &amp; References</a></li>
            <li><a href="/sources">Challenge our data</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 National Check-in Week · For informational and advocacy purposes only. Not clinical advice.</p>
      </div>
    </footer>
  );
}
