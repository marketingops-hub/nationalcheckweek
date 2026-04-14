import Link from "next/link";

interface Props {
  backHref: string;
  backLabel: string;
}

export default function InnerNav({ backHref, backLabel }: Props) {
  return (
    <nav className="inner-nav">
      <Link href="/" className="nav-logo">
        <span>National</span> Check-in Week
      </Link>

      <div className="inner-nav-right">
        <Link href="/#map" className="inner-nav-link">Map</Link>
        <Link href="/issues" className="inner-nav-link">Issues</Link>
        <Link href="/events" className="inner-nav-link">Events</Link>
        <Link href="/sources" className="inner-nav-link">Sources</Link>
        <Link href="/faq" className="inner-nav-link">FAQ</Link>
        <Link href="/ambassadors" className="inner-nav-link">Ambassadors</Link>
        <Link href="/partners" className="inner-nav-link">Partners</Link>
        <Link href={backHref} className="inner-nav-back">
          ← {backLabel}
        </Link>
      </div>
    </nav>
  );
}
