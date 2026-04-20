'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import BadgePill from './BadgePill';
import EventBodyRenderer from './EventBodyRenderer';
import HubSpotForm from '@/components/shared/HubSpotForm';
import {
  FORMAT_LABEL, FORMAT_BADGE, STATUS_BADGE,
  formatDateLong, formatDateShort,
  type EventRecord,
  type Speaker,
} from '@/lib/events';

const FORMAT_ICON: Record<string, string> = {
  webinar: "💻", "in-person": "📍", hybrid: "🔀",
  workshop: "🛠️", conference: "🎤",
};

interface EventPageClientProps {
  event: EventRecord;
  speakers: Speaker[];
}

export default function EventPageClient({ event, speakers }: EventPageClientProps) {
  const isPast = event.status === "past";
  const isLive = event.status === "live";
  const fmtBadge = FORMAT_BADGE[event.format ?? 'webinar'] ?? { bg: "#F9FAFB", color: "#374151" };
  const stsBadge = STATUS_BADGE[event.status ?? 'upcoming'] ?? { bg: "#F9FAFB", color: "#374151" };
  const hasHubSpotForm = Boolean(!isPast && event.hubspot_form_id && event.hubspot_portal_id);

  const [formReady, setFormReady] = useState(false);
  const handleFormReady = useCallback(() => setFormReady(true), []);

  return (
    <>
      {/* ── HERO ── */}
      <div className="page-hero" style={{ paddingBottom: 0 }}>
        <div className="page-hero__inner" style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div className="page-hero__breadcrumb">
            <Link href="/events">Events</Link> / {event.title}
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <BadgePill {...fmtBadge} label={FORMAT_LABEL[event.format ?? ''] ?? event.format ?? 'Event'} />
            {isLive  && <BadgePill bg="#FEF2F2" color="#DC2626" label="● Live now" />}
            {isPast  && <BadgePill bg="#F3F4F6" color="#6B7280" label="Past event" />}
            {!isPast && !isLive && <BadgePill {...stsBadge} label={event.status} />}
            {event.is_free && <BadgePill bg="#F0FDF4" color="#16A34A" label="Free" />}
          </div>

          <h1 className="page-hero__title">{event.title}</h1>
          {event.tagline && (
            <p className="page-hero__subtitle" style={{ maxWidth: 740 }}>{event.tagline}</p>
          )}

          {/* Meta bar */}
          {(event.event_date || event.event_time || event.format) && (
            <div className="event-hero-meta">
              {event.event_date && (
                <div className="event-hero-meta__item">
                  <span className="event-hero-meta__icon">📅</span>
                  <span>{formatDateLong(event.event_date)}</span>
                </div>
              )}
              {event.event_time && (
                <div className="event-hero-meta__item">
                  <span className="event-hero-meta__icon">🕐</span>
                  <span>{event.event_time}{event.event_end ? ` – ${event.event_end}` : ""}</span>
                </div>
              )}
              <div className="event-hero-meta__item">
                <span className="event-hero-meta__icon">{FORMAT_ICON[event.format ?? 'webinar'] ?? "📋"}</span>
                <span>{FORMAT_LABEL[event.format ?? 'webinar'] ?? event.format ?? 'Event'}</span>
              </div>
              {event.format === "in-person" && event.location && (
                <div className="event-hero-meta__item">
                  <span className="event-hero-meta__icon">📍</span>
                  <span>{event.location}</span>
                </div>
              )}

              {/* Jump-to-form CTA — always visible in hero */}
              {hasHubSpotForm && (
                <a href="#event-hubspot-form-container" className="event-hero-register-cta">
                  Register now ↓
                </a>
              )}
              {!hasHubSpotForm && !isPast && event.register_url && (
                <a href={event.register_url} target="_blank" rel="noopener noreferrer" className="event-hero-register-cta">
                  {isLive ? "🔴 Join live" : "Register now →"}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <main id="main-content" className="inner-content" style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="event-detail-grid">

          {/* ── LEFT: Content ── */}
          <div>
            {/* Feature image */}
            {event.feature_image && event.feature_image.trim() !== '' && (
              <div className="event-feature-image">
                <Image src={event.feature_image} alt={event.title} fill style={{ objectFit: "contain" }} />
              </div>
            )}

            {/* About the event */}
            {event.description && (
              <section className="event-section">
                <div className="eyebrow-tag">About the event</div>
                <EventBodyRenderer content={event.description} />
              </section>
            )}

            {/* Body content */}
            {event.body && (
              <section className="event-section">
                <EventBodyRenderer content={event.body} />
              </section>
            )}

            {/* Recording callout (past events) */}
            {isPast && event.recording_url && (
              <div className="event-recording-callout">
                <div className="event-recording-callout__icon">🎬</div>
                <div className="event-recording-callout__body">
                  <div className="event-recording-callout__label">Recording available</div>
                  <div className="event-recording-callout__title">Missed the live session?</div>
                  <p className="event-recording-callout__text">
                    Watch the full recording at your own pace. All the insights, none of the scheduling pressure.
                  </p>
                  <a
                    href={event.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-recording-callout__link"
                  >
                    ▶ Watch recording
                  </a>
                </div>
              </div>
            )}

            {/* Speakers */}
            {speakers.length > 0 && (
              <section className="event-section">
                <div className="eyebrow-tag">
                  {speakers.length === 1 ? "Your presenter" : "Meet the experts"}
                </div>
                <div className="event-speakers">
                  {speakers.map((sp) => (
                    <div key={sp.id} className="event-speaker">
                      <div className="event-speaker__avatar">
                        {sp.photo ? (
                          <Image src={sp.photo} alt={sp.name} fill style={{ objectFit: "cover" }} />
                        ) : (
                          <div className="event-speaker__avatar-placeholder">👤</div>
                        )}
                      </div>
                      <div className="event-speaker__info">
                        <div className="event-speaker__name">{sp.name}</div>
                        {sp.title && <div className="event-speaker__role">{sp.title}</div>}
                        {sp.bio && <p className="event-speaker__bio">{sp.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: Registration Form or Sidebar ── */}
          <div className="event-sidebar">
            {/* HubSpot Form Embed - Matches /register page style */}
            {hasHubSpotForm && (
              <motion.div
                className="event-hubspot-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="eyebrow-tag" style={{ marginBottom: 16 }}>Register Here</div>
                {!formReady && (
                  <div className="event-form-skeleton">
                    <span className="skel" style={{ height: 18, marginBottom: 20, display: 'block' }} />
                    <span className="skel" style={{ height: 42, marginBottom: 12, display: 'block' }} />
                    <span className="skel" style={{ height: 42, marginBottom: 12, display: 'block' }} />
                    <span className="skel" style={{ height: 42, marginBottom: 12, display: 'block' }} />
                    <span className="skel" style={{ height: 42, marginBottom: 20, display: 'block' }} />
                    <span className="skel" style={{ height: 50, display: 'block' }} />
                  </div>
                )}
                <HubSpotForm
                  portalId={event.hubspot_portal_id!}
                  formId={event.hubspot_form_id!}
                  containerId="event-hubspot-form-container"
                  onFormReady={handleFormReady}
                />
              </motion.div>
            )}

            {/* Register Card - Only show if no HubSpot form */}
            {!hasHubSpotForm && !isPast && (
              <div className="event-register-card">
                {/* Header */}
                <div className="event-register-card__header">
                  <div className="event-register-card__price">
                    {event.is_free ? "Free" : (event.price || "Paid")}
                  </div>
                  <div className="event-register-card__price-sub">
                    {event.is_free ? "No cost to attend" : "Per person"}
                  </div>
                </div>

                {/* Body */}
                <div className="event-register-card__body">
                  {/* Date/time */}
                  {(event.event_date || event.event_time) && (
                    <div className="event-register-card__date">
                      {event.event_date && (
                        <div className="event-register-card__date-row">
                          <span>📅</span>
                          <span>{formatDateShort(event.event_date)}</span>
                        </div>
                      )}
                      {event.event_time && (
                        <div className="event-register-card__date-row">
                          <span>🕐</span>
                          <span>{event.event_time}{event.event_end ? ` – ${event.event_end}` : ""}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  {event.register_url && (
                    <a
                      href={event.register_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`event-register-btn${isLive ? " event-register-btn--live" : ""}`}
                    >
                      {isLive ? "🔴 Join live now" : "Register now →"}
                    </a>
                  )}
                  {!event.register_url && (
                    <div className="event-register-coming-soon">
                      Registration opening soon
                    </div>
                  )}

                  {/* Meta */}
                  <div className="event-register-card__meta">
                    <div className="event-register-card__meta-row">
                      <span>{FORMAT_ICON[event.format ?? 'webinar'] ?? "📋"}</span>
                      <span>{FORMAT_LABEL[event.format ?? 'webinar'] ?? event.format ?? 'Event'}</span>
                    </div>
                    {event.is_free && (
                      <div className="event-register-card__meta-row">
                        <span>✅</span><span>Free to attend</span>
                      </div>
                    )}
                    {speakers.length > 0 && (
                      <div className="event-register-card__meta-row">
                        <span>🎤</span>
                        <span>{speakers.length} presenter{speakers.length !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                    {event.format === "webinar" && (
                      <div className="event-register-card__meta-row">
                        <span>💻</span><span>Online — join from anywhere</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back link */}
                <Link href="/events" className="event-register-card__back">
                  ← All events
                </Link>
              </div>
            )}

            {/* Past Event Card */}
            {isPast && (
              <div className="event-register-card">
                <div className="event-register-card__body">
                  {event.recording_url && (
                    <a
                      href={event.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-register-btn event-register-btn--secondary"
                    >
                      ▶ Watch recording
                    </a>
                  )}
                  {!event.recording_url && (
                    <div className="event-register-coming-soon">
                      Recording coming soon
                    </div>
                  )}

                  {/* Meta */}
                  <div className="event-register-card__meta">
                    <div className="event-register-card__meta-row">
                      <span>{FORMAT_ICON[event.format ?? 'webinar'] ?? "📋"}</span>
                      <span>{FORMAT_LABEL[event.format ?? 'webinar'] ?? event.format ?? 'Event'}</span>
                    </div>
                    {speakers.length > 0 && (
                      <div className="event-register-card__meta-row">
                        <span>🎤</span>
                        <span>{speakers.length} presenter{speakers.length !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Link href="/events" className="event-register-card__back">
                  ← All events
                </Link>
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
