import Image from "next/image";

export default function Footer() {
  return (
    <>
      {/* Contact Us Banner */}
      <div className="footer-contact-banner">
        <div className="footer-contact-banner__inner">
          <h2 className="footer-contact-banner__title">Contact Us</h2>
          <a href="mailto:events@nationalcheckinweek.com" className="footer-contact-banner__email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            events@nationalcheckinweek.com
          </a>
        </div>
      </div>

      {/* Main Footer */}
      <footer id="about">
        <div className="footer-main">
          {/* Left: Logo */}
          <div className="footer-logo-col">
            <a href="/" className="footer-logo-link">
              <Image
                src="/nciw-logo.svg"
                alt="National Check-in Week logo"
                width={80}
                height={96}
                className="footer-logo-img"
              />
              <div className="footer-logo-text">
                <span className="footer-logo-name">NATIONAL CHECK-IN WEEK</span>
                <span className="footer-logo-tagline">EMPOWERING VOICES. BRIDGING GAPS. SUPPORTING EVERY CHILD</span>
              </div>
            </a>
          </div>

          {/* Right: Nav Links */}
          <nav className="footer-nav-col" aria-label="Footer navigation">
            <ul className="footer-nav-list">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/ambassadors">Meet Our Ambassadors</a></li>
              <li><a href="/events">Events</a></li>
              <li><a href="/partners">Partners</a></li>
              <li><a href="/resources">Resources</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar: social icons + copyright */}
        <div className="footer-bottom-bar">
          <div className="footer-social-row">
            {/* Facebook */}
            <a href="https://www.facebook.com/groups/nationalcheckinweek/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            {/* X / Twitter */}
            <a href="https://x.com/CheckInWeek_" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="X (Twitter)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://www.instagram.com/nationalcheckinweek" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://www.linkedin.com/groups/14629770/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="LinkedIn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <span className="footer-social-label">Follow us!</span>
          </div>
          <p className="footer-copyright">© 2026 National Check-in Week. &nbsp;All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
