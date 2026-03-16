import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as staticClient } from "@supabase/supabase-js";
import BadgePill from "@/components/events/BadgePill";
import { FORMAT_LABEL, FORMAT_BADGE, STATUS_BADGE, formatDateLong, formatDateShort } from "@/lib/events";

export const revalidate = 60;

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
  sort_order: number;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  body: string;
  event_date: string | null;
  event_time: string;
  event_end: string;
  format: string;
  location: string;
  feature_image: string;
  is_free: boolean;
  price: string;
  register_url: string;
  recording_url: string;
  status: string;
  event_speakers: Speaker[];
}

export async function generateStaticParams() {
  const sb = staticClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await sb.from("events").select("slug").eq("published", true);
  return (data ?? []).map((e: { slug: string }) => ({ slug: e.slug }));
}


export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();

  const { data } = await sb
    .from("events")
    .select("*, event_speakers(*)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) notFound();
  const event = data as Event;

  const speakers = [...(event.event_speakers ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const isPast   = event.status === "past";
  const isLive   = event.status === "live";
  const fmtBadge = FORMAT_BADGE[event.format] ?? { bg: "#F9FAFB", color: "#374151" };
  const stsBadge = STATUS_BADGE[event.status] ?? { bg: "#F9FAFB", color: "#374151" };

  return (
    <>
      {/* HERO */}
      <div className="page-hero" style={{ paddingBottom: 0 }}>
        <div className="page-hero__inner" style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <BadgePill {...fmtBadge} label={FORMAT_LABEL[event.format] ?? event.format} />
            <BadgePill {...stsBadge} label={event.status} />
            {event.is_free && <BadgePill bg="#F0FDF4" color="#16A34A" label="Free" />}
            {isLive && <BadgePill bg="#FEF2F2" color="#DC2626" label="● Live now" />}
            {isPast && <BadgePill bg="#F3F4F6" color="#6B7280" label="Past event" />}
          </div>
          <h1 className="page-hero__title">{event.title}</h1>
          {event.tagline && (
            <p className="page-hero__subtitle" style={{ maxWidth: 720 }}>{event.tagline}</p>
          )}

          {/* Date + Time bar */}
          {(event.event_date || event.event_time) && (
            <div style={{
              display: "flex", gap: 24, flexWrap: "wrap", marginTop: 24,
              padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.15)",
            }}>
              {event.event_date && (
                <div style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📅</span>
                  <span>{formatDateLong(event.event_date)}</span>
                </div>
              )}
              {event.event_time && (
                <div style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🕐</span>
                  <span>{event.event_time}{event.event_end ? ` – ${event.event_end}` : ""}</span>
                </div>
              )}
              {event.format === "webinar" && (
                <div style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>💻</span><span>Online Webinar</span>
                </div>
              )}
              {event.format === "in-person" && event.location && (
                <div style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📍</span><span>{event.location}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main id="main-content" className="inner-content" style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="event-detail-grid">

          {/* LEFT COLUMN — Content */}
          <div>
            {/* Feature image */}
            {event.feature_image && (
              <div style={{ position: "relative", width: "100%", height: 360, borderRadius: 16, overflow: "hidden", marginBottom: 36 }}>
                <Image src={event.feature_image} alt={event.title} fill style={{ objectFit: "cover" }} />
              </div>
            )}

            {/* Description */}
            {event.description && (
              <section style={{ marginBottom: 36 }}>
                <div className="eyebrow-tag" style={{ marginBottom: 16 }}>About the event</div>
                <div style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>
                  {event.description}
                </div>
              </section>
            )}

            {/* Body */}
            {event.body && (
              <section style={{ marginBottom: 36 }}>
                <div style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>
                  {event.body}
                </div>
              </section>
            )}

            {/* Past event recording */}
            {isPast && event.recording_url && (
              <div style={{
                background: "var(--gray-50)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "24px", marginBottom: 36,
              }}>
                <div className="eyebrow-tag" style={{ marginBottom: 12 }}>Recording available</div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-mid)", marginBottom: 16 }}>
                  Missed this event? Watch the full recording.
                </p>
                <a href={event.recording_url} target="_blank" rel="noopener noreferrer"
                  className="prevention-bridge__cta" style={{ display: "inline-block" }}>
                  Watch recording ↗
                </a>
              </div>
            )}

            {/* Speakers */}
            {speakers.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 className="section-heading section-heading--md">About our experts</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  {speakers.map((sp) => (
                    <div key={sp.id} style={{
                      display: "grid", gridTemplateColumns: "80px 1fr", gap: 20,
                      alignItems: "flex-start",
                    }}>
                      <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--gray-100)" }}>
                        {sp.photo ? (
                          <Image src={sp.photo} alt={sp.name} fill style={{ objectFit: "cover" }} />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "1.8rem" }}>👤</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--navy)", marginBottom: 2 }}>{sp.name}</div>
                        {sp.title && <div style={{ fontSize: "0.82rem", color: "var(--teal)", fontWeight: 600, marginBottom: 10 }}>{sp.title}</div>}
                        {sp.bio && <div style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-body)" }}>{sp.bio}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN — Register sidebar */}
          <div>
            <div className="event-register-card">
              <div className="event-register-card__price">
                {event.is_free ? "Free" : event.price}
              </div>
              {event.event_date && (
                <div className="event-register-card__date">
                  {formatDateShort(event.event_date)}
                  {event.event_time && <><br />{event.event_time}{event.event_end ? ` – ${event.event_end}` : ""}</>}
                </div>
              )}

              {!isPast && event.register_url && (
                <a href={event.register_url} target="_blank" rel="noopener noreferrer" className="event-register-btn">
                  {isLive ? "Join now →" : "Register for free →"}
                </a>
              )}

              {!isPast && !event.register_url && (
                <div style={{ fontSize: "0.85rem", color: "var(--text-light)", textAlign: "center", padding: "12px 0" }}>
                  Registration coming soon
                </div>
              )}

              {isPast && event.recording_url && (
                <a href={event.recording_url} target="_blank" rel="noopener noreferrer"
                  className="event-register-btn event-register-btn--secondary">
                  Watch recording ↗
                </a>
              )}

              <div className="event-register-card__meta">
                <div>📅 {FORMAT_LABEL[event.format] ?? event.format}</div>
                {event.is_free && <div>✅ Free to attend</div>}
                {!event.is_free && event.price && <div>💳 {event.price}</div>}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Link href="/events" style={{ fontSize: "0.85rem", color: "var(--teal)", textDecoration: "none", fontWeight: 600 }}>
                ← All events
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
