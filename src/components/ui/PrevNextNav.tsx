import Link from "next/link";

interface PrevNextNavProps {
  prevHref?: string | null;
  prevLabel?: string | null;
  nextHref?: string | null;
  nextLabel?: string | null;
}

export default function PrevNextNav({ prevHref, prevLabel, nextHref, nextLabel }: PrevNextNavProps) {
  return (
    <div className="prev-next-nav">
      <div>
        {prevHref && (
          <Link href={prevHref} className="prev-next-nav__link">
            <span className="prev-next-nav__dir">← Previous</span>
            <span className="prev-next-nav__label">{prevLabel}</span>
          </Link>
        )}
      </div>
      <div>
        {nextHref && (
          <Link href={nextHref} className="prev-next-nav__link prev-next-nav__link--right">
            <span className="prev-next-nav__dir">Next →</span>
            <span className="prev-next-nav__label">{nextLabel}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
