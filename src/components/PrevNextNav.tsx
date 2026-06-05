import Link from "next/link";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  /** Text or JSX shown below the ← / → arrow. */
  label: ReactNode;
}

interface PrevNextNavProps {
  prev?: NavItem | null;
  next?: NavItem | null;
}

/**
 * Prev / Next navigation row shared by issues/[slug] and states/[slug].
 * Renders nothing for a side where no item is provided.
 */
export default function PrevNextNav({ prev, next }: PrevNextNavProps) {
  return (
    <div className="prev-next-nav">
      <div>
        {prev && (
          <Link href={prev.href} className="prev-next-nav__link">
            <span className="prev-next-nav__dir">← Previous</span>
            <span className="prev-next-nav__label">{prev.label}</span>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link href={next.href} className="prev-next-nav__link prev-next-nav__link--right">
            <span className="prev-next-nav__dir">Next →</span>
            <span className="prev-next-nav__label">{next.label}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
