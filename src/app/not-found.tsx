import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <nav className="inner-nav">
        <Link href="/" className="nav-logo">
          National Check-in Week
        </Link>
      </nav>

      <div className="not-found">
        <div className="not-found__eyebrow">404 — Page Not Found</div>
        <h1 className="not-found__title">This page doesn&apos;t exist</h1>
        <p className="not-found__desc">
          The page you&apos;re looking for may have moved, been renamed, or never existed.
          Head back to the monitor to explore student wellbeing data by state and issue.
        </p>

        <div className="not-found__actions">
          <Link href="/" className="not-found__btn not-found__btn--primary">← Back to Monitor</Link>
          <Link href="/#map" className="not-found__btn not-found__btn--secondary">Explore the Map</Link>
        </div>

        <div className="not-found__links">
          {[
            { href: "/states/new-south-wales", label: "NSW" },
            { href: "/states/victoria", label: "VIC" },
            { href: "/states/queensland", label: "QLD" },
            { href: "/states/western-australia", label: "WA" },
            { href: "/issues/anxiety-depression", label: "Anxiety" },
            { href: "/issues/self-harm-suicidality", label: "Self-Harm" },
          ].map(l => (
            <Link key={l.href} href={l.href} className="not-found__link">{l.label}</Link>
          ))}
        </div>
      </div>
    </>
  );
}
