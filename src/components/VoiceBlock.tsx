import Link from "next/link";

export interface VoiceBlockData {
  heading: string;
  body: string;
  cta_text: string;
  cta_url: string;
  /** "true" | "false" — stored as string to match site_settings DB schema */
  enabled: string;
}

export const VOICE_DEFAULTS: VoiceBlockData = {
  heading: "Your voice matters",
  body: "We are inviting educators, parents and carers to share what they are seeing in the lives of children and young people today.\n\nYour perspective is valuable. Your insight is important. What you share can help shape a stronger response for young people.",
  cta_text: "Join the Conversation",
  cta_url: "/your-voice",
  enabled: "true",
};

function isExternal(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function VoiceBlock({ data }: { data?: Partial<VoiceBlockData> }) {
  const d: VoiceBlockData = { ...VOICE_DEFAULTS, ...data };
  if (d.enabled === "false") return null;

  const paragraphs = d.body.split(/\n+/).filter(Boolean);
  const ctaClass = "voice-block__cta";

  return (
    <section className="voice-block" aria-label="Your voice matters">
      <div className="voice-block__decor voice-block__decor--lg" aria-hidden="true" />
      <div className="voice-block__decor voice-block__decor--sm" aria-hidden="true" />

      <div className="voice-block__inner">
        <div className="voice-block__eyebrow">🎤 Have Your Say</div>

        <h2 className="voice-block__heading">{d.heading}</h2>

        <div className="voice-block__body">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        {isExternal(d.cta_url) ? (
          <a href={d.cta_url} target="_blank" rel="noopener noreferrer" className={ctaClass}>
            {d.cta_text} ↗
          </a>
        ) : (
          <Link href={d.cta_url} className={ctaClass}>
            {d.cta_text} →
          </Link>
        )}
      </div>
    </section>
  );
}
