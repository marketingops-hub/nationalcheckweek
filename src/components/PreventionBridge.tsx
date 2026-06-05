import type { ReactNode } from "react";

interface PreventionBridgeProps {
  heading: string;
  /** Body paragraphs (one or more <p> elements). */
  children: ReactNode;
  ctaText: string;
  ctaHref: string;
  /** Eyebrow label above the heading. Defaults to "From Data to Prevention". */
  eyebrow?: string;
}

/**
 * "Data to Prevention" marketing block shared by geo and issue templates.
 * Replaces the previously duplicated `.prevention-bridge` markup in
 * states/[slug] and issues/[slug]. The CTA always opens in a new tab.
 */
export default function PreventionBridge({
  heading,
  children,
  ctaText,
  ctaHref,
  eyebrow = "From Data to Prevention",
}: PreventionBridgeProps) {
  return (
    <section className="prevention-bridge">
      <div className="eyebrow-tag">{eyebrow}</div>
      <h3 className="prevention-bridge__heading">{heading}</h3>
      <div className="prevention-bridge__body">{children}</div>
      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className="prevention-bridge__cta"
      >
        {ctaText}
      </a>
    </section>
  );
}
