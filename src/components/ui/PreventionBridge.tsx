interface PreventionBridgeProps {
  heading: string;
  body: string | React.ReactNode;
  ctaText?: string;
  ctaHref?: string;
}

export default function PreventionBridge({ heading, body, ctaText, ctaHref }: PreventionBridgeProps) {
  return (
    <section className="prevention-bridge">
      <div className="eyebrow-tag">From Data to Prevention</div>
      <h3 className="prevention-bridge__heading">{heading}</h3>
      <div className="prevention-bridge__body">{typeof body === "string" ? <p>{body}</p> : body}</div>
      {ctaText && ctaHref && (
        <a href={ctaHref} target="_blank" rel="noopener noreferrer" className="prevention-bridge__cta">
          {ctaText} ↗
        </a>
      )}
    </section>
  );
}
