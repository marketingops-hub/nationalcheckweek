"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import BadgePill from "./BadgePill";
import EventBodyRenderer from "./EventBodyRenderer";
import HubSpotForm from "@/components/shared/HubSpotForm";
import {
  FORMAT_LABEL,
  FORMAT_BADGE,
  STATUS_BADGE,
  formatDateLong,
  formatDateShort,
  type EventRecord,
  type Speaker,
} from "@/lib/events";

const FORMAT_ICON: Record<string, string> = {
  webinar: "💻",
  "in-person": "📍",
  hybrid: "🔀",
  workshop: "🛠️",
  conference: "🎤",
};

// Fixed HubSpot form that gates access to past-webinar recordings.
const RECORDING_GATE_PORTAL = "4596264";
const RECORDING_GATE_FORM = "ec82365a-7028-487c-8d6d-8d34eefc00ee";

function recordingLsKey(slug: string) {
  return `ncw_rec_unlocked_${slug}`;
}

interface EventPageClientProps {
  event: EventRecord;
  speakers: Speaker[];
}

export default function EventPageClient({
  event,
  speakers,
}: EventPageClientProps) {
  // Treat as past if status is explicitly "past" OR the event date has already passed.
  const isPast =
    event.status === "past" ||
    event.status === "cancelled" ||
    (() => {
      if (!event.event_date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const evDate = new Date(event.event_date);
      evDate.setHours(0, 0, 0, 0);
      return evDate < today;
    })();
  // Only treat as live if explicitly flagged — date alone can't confirm the session is running.
  const isLive = !isPast && event.status === "live";
  const fmtBadge = FORMAT_BADGE[event.format ?? "webinar"] ?? {
    bg: "#F9FAFB",
    color: "#374151",
  };
  const stsBadge = STATUS_BADGE[event.status ?? "upcoming"] ?? {
    bg: "#F9FAFB",
    color: "#374151",
  };
  const hasHubSpotForm = Boolean(
    !isPast && event.hubspot_form_id && event.hubspot_portal_id,
  );

  // Registration form state (upcoming events)
  const [formReady, setFormReady] = useState(false);
  const handleFormReady = useCallback(() => setFormReady(true), []);

  // Recording gate state (past events)
  const [recordingUnlocked, setRecordingUnlocked] = useState(false);
  const [gateReady, setGateReady] = useState(false);

  // Read localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    if (isPast && event.recording_url) {
      setRecordingUnlocked(
        localStorage.getItem(recordingLsKey(event.slug)) === "1",
      );
    }
  }, [isPast, event.recording_url, event.slug]);

  const handleRecordingFormSubmit = useCallback(() => {
    localStorage.setItem(recordingLsKey(event.slug), "1");
    setRecordingUnlocked(true);
  }, [event.slug]);

  const handleFormSubmit = useCallback(
    (_$form: HTMLFormElement, data: Record<string, unknown>) => {
      console.log("[Zoom] onFormSubmit fired. Raw data:", data);

      if (!event.hubspot_form_id) {
        console.warn("[Zoom] No hubspot_form_id on event — aborting");
        return;
      }

      const fields: Record<string, string> = {};
      if (Array.isArray(data)) {
        (data as Array<{ name: string; value: string }>).forEach((f) => {
          fields[f.name] = f.value;
        });
      }

      const webinarIds: string[] = [];
      const rawWebinarField = fields.bulk_zoom_registration;

      if (typeof rawWebinarField === "string") {
        webinarIds.push(
          ...rawWebinarField
            .split(/[;,]/)
            .map((id) => id.trim())
            .filter(Boolean),
        );
      } else if (Array.isArray(rawWebinarField)) {
        webinarIds.push(...(rawWebinarField as string[]));
      }

      if (webinarIds.length === 0) {
        console.warn(
          "[Zoom] No webinar IDs found — skipping Zoom registration",
        );
        return;
      }

      fetch("/api/hubspot-zoom-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hubspot_form_id: event.hubspot_form_id,
          zoom_webinar_ids: webinarIds,
          fields,
          context: { pageUri: window.location.href, pageName: document.title },
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (!result.success)
            console.error("[Zoom] Registration failed:", result);
        })
        .catch((err) => console.error("[Zoom] Fetch error:", err));
    },
    [event.hubspot_form_id],
  );

  return (
    <>
      {/* ── HERO ── */}
      <div className="page-hero" style={{ paddingBottom: 0 }}>
        <div
          className="page-hero__inner"
          style={{ maxWidth: 1000, margin: "0 auto" }}
        >
          <div className="page-hero__breadcrumb">
            <Link href="/events">Events</Link> / {event.title}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <BadgePill
              {...fmtBadge}
              label={
                FORMAT_LABEL[event.format ?? ""] ?? event.format ?? "Event"
              }
            />
            {isLive && (
              <BadgePill bg="#FEF2F2" color="#DC2626" label="● Live now" />
            )}
            {isPast && (
              <BadgePill bg="#F3F4F6" color="#6B7280" label="Past event" />
            )}
            {!isPast && !isLive && (
              <BadgePill {...stsBadge} label={event.status} />
            )}
            {event.is_free && (
              <BadgePill bg="#F0FDF4" color="#16A34A" label="Free" />
            )}
          </div>

          <h1 className="page-hero__title">{event.title}</h1>
          {event.tagline && (
            <p className="page-hero__subtitle" style={{ maxWidth: 740 }}>
              {event.tagline}
            </p>
          )}

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
                  <span>
                    {event.event_time}
                    {event.event_end ? ` – ${event.event_end}` : ""}
                  </span>
                </div>
              )}
              <div className="event-hero-meta__item">
                <span className="event-hero-meta__icon">
                  {FORMAT_ICON[event.format ?? "webinar"] ?? "📋"}
                </span>
                <span>
                  {FORMAT_LABEL[event.format ?? "webinar"] ??
                    event.format ??
                    "Event"}
                </span>
              </div>
              {event.format === "in-person" && event.location && (
                <div className="event-hero-meta__item">
                  <span className="event-hero-meta__icon">📍</span>
                  <span>{event.location}</span>
                </div>
              )}

              {hasHubSpotForm && (
                <a
                  href="#event-hubspot-form-container"
                  className="event-hero-register-cta"
                >
                  Register now ↓
                </a>
              )}
              {!hasHubSpotForm && !isPast && event.register_url && (
                <a
                  href={event.register_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-hero-register-cta"
                >
                  {isLive ? "🔴 Join live" : "Register now →"}
                </a>
              )}
              {/* Scroll-to-form CTA for past events with a gated recording */}
              {isPast && event.recording_url && !recordingUnlocked && (
                <a href="#recording-gate" className="event-hero-register-cta">
                  🎬 Watch recording ↓
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <main
        id="main-content"
        className="inner-content"
        style={{ maxWidth: 1000, margin: "0 auto" }}
      >
        <div className="event-detail-grid">
          {/* ── LEFT: Content ── */}
          <div>
            {event.feature_image && event.feature_image.trim() !== "" && (
              <div className="event-feature-image">
                <Image
                  src={event.feature_image}
                  alt={event.title}
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            )}

            {event.description && (
              <section className="event-section">
                <div className="eyebrow-tag">About the event</div>
                <EventBodyRenderer content={event.description} />
              </section>
            )}

            {event.body && (
              <section className="event-section">
                <EventBodyRenderer content={event.body} />
              </section>
            )}

            {/* Speakers */}
            {speakers.length > 0 && (
              <section className="event-section">
                <div className="eyebrow-tag">
                  {speakers.length === 1
                    ? "Your presenter"
                    : "Meet the experts"}
                </div>
                <div className="event-speakers">
                  {speakers.map((sp) => (
                    <div key={sp.id} className="event-speaker">
                      <div className="event-speaker__avatar">
                        {sp.photo ? (
                          <Image
                            src={sp.photo}
                            alt={sp.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="event-speaker__avatar-placeholder">
                            👤
                          </div>
                        )}
                      </div>
                      <div className="event-speaker__info">
                        <div className="event-speaker__name">{sp.name}</div>
                        {sp.title && (
                          <div className="event-speaker__role">{sp.title}</div>
                        )}
                        {sp.bio && (
                          <p className="event-speaker__bio">{sp.bio}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="event-sidebar">
            {/* Upcoming: HubSpot registration form */}
            {hasHubSpotForm && (
              <motion.div
                className="event-hubspot-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="eyebrow-tag" style={{ marginBottom: 16 }}>
                  Register Here
                </div>
                {!formReady && (
                  <div className="event-form-skeleton">
                    <span
                      className="skel"
                      style={{ height: 18, marginBottom: 20, display: "block" }}
                    />
                    <span
                      className="skel"
                      style={{ height: 42, marginBottom: 12, display: "block" }}
                    />
                    <span
                      className="skel"
                      style={{ height: 42, marginBottom: 12, display: "block" }}
                    />
                    <span
                      className="skel"
                      style={{ height: 42, marginBottom: 12, display: "block" }}
                    />
                    <span
                      className="skel"
                      style={{ height: 42, marginBottom: 20, display: "block" }}
                    />
                    <span
                      className="skel"
                      style={{ height: 50, display: "block" }}
                    />
                  </div>
                )}
                <HubSpotForm
                  portalId={event.hubspot_portal_id!}
                  formId={event.hubspot_form_id!}
                  containerId="event-hubspot-form-container"
                  onFormReady={handleFormReady}
                  onFormSubmit={handleFormSubmit}
                />
              </motion.div>
            )}

            {/* Upcoming: plain register card (no HubSpot form) */}
            {!hasHubSpotForm && !isPast && (
              <div className="event-register-card">
                <div className="event-register-card__header">
                  <div className="event-register-card__price">
                    {event.is_free ? "Free" : event.price || "Paid"}
                  </div>
                  <div className="event-register-card__price-sub">
                    {event.is_free ? "No cost to attend" : "Per person"}
                  </div>
                </div>
                <div className="event-register-card__body">
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
                          <span>
                            {event.event_time}
                            {event.event_end ? ` – ${event.event_end}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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
                  <div className="event-register-card__meta">
                    <div className="event-register-card__meta-row">
                      <span>
                        {FORMAT_ICON[event.format ?? "webinar"] ?? "📋"}
                      </span>
                      <span>
                        {FORMAT_LABEL[event.format ?? "webinar"] ??
                          event.format ??
                          "Event"}
                      </span>
                    </div>
                    {event.is_free && (
                      <div className="event-register-card__meta-row">
                        <span>✅</span>
                        <span>Free to attend</span>
                      </div>
                    )}
                    {speakers.length > 0 && (
                      <div className="event-register-card__meta-row">
                        <span>🎤</span>
                        <span>
                          {speakers.length} presenter
                          {speakers.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {event.format === "webinar" && (
                      <div className="event-register-card__meta-row">
                        <span>💻</span>
                        <span>Online — join from anywhere</span>
                      </div>
                    )}
                  </div>
                </div>
                <Link href="/events" className="event-register-card__back">
                  ← All events
                </Link>
              </div>
            )}

            {/* Past event sidebar */}
            {isPast && (
              <div className="event-register-card">
                <div className="event-register-card__body">
                  {event.recording_url && recordingUnlocked && (
                    <a
                      href={event.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-register-btn event-register-btn--secondary"
                    >
                      ▶ Watch recording
                    </a>
                  )}
                  {event.recording_url && !recordingUnlocked && (
                    // <a
                    //   href="#recording-gate"
                    //   className="event-register-btn event-register-btn--secondary"
                    // >
                    //   🔒 Access recording ↓
                    // </a>
                    <>
                      {/* ── Recording section (past events) ── */}
                      {isPast && event.recording_url && (
                        <div
                          id="recording-gate"
                          className="event-recording-callout"
                        >
                          <div className="event-recording-callout__icon">
                            🎬
                          </div>
                          <div className="event-recording-callout__body">
                            {recordingUnlocked ? (
                              /* Unlocked: show the recording link */
                              <>
                                <div className="event-recording-callout__label">
                                  Recording available
                                </div>
                                <div className="event-recording-callout__title">
                                  You&rsquo;re all set!
                                </div>
                                <p className="event-recording-callout__text">
                                  Watch the full recording at your own pace. All
                                  the insights, none of the scheduling pressure.
                                </p>
                                <a
                                  href={event.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="event-recording-callout__link"
                                >
                                  ▶ Watch recording
                                </a>
                              </>
                            ) : (
                              /* Locked: subscribe via HubSpot to unlock */
                              <>
                                <div className="event-recording-callout__label">
                                  Recording available
                                </div>
                                <div className="event-recording-callout__title">
                                  Missed the live session?
                                </div>
                                <p className="event-recording-callout__text">
                                  Enter your details below to get instant access
                                  to the full recording.
                                </p>
                                {!gateReady && (
                                  <div
                                    style={{
                                      padding: "0.5rem 0 1rem",
                                      color: "#94a3b8",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    Loading form…
                                  </div>
                                )}
                                <HubSpotForm
                                  portalId={RECORDING_GATE_PORTAL}
                                  formId={RECORDING_GATE_FORM}
                                  containerId="recording-gate-form"
                                  onFormReady={() => setGateReady(true)}
                                  onFormSubmit={handleRecordingFormSubmit}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {!event.recording_url && (
                    <div className="event-register-coming-soon">
                      Recording coming soon
                    </div>
                  )}
                  <div className="event-register-card__meta">
                    <div className="event-register-card__meta-row">
                      <span>
                        {FORMAT_ICON[event.format ?? "webinar"] ?? "📋"}
                      </span>
                      <span>
                        {FORMAT_LABEL[event.format ?? "webinar"] ??
                          event.format ??
                          "Event"}
                      </span>
                    </div>
                    {speakers.length > 0 && (
                      <div className="event-register-card__meta-row">
                        <span>🎤</span>
                        <span>
                          {speakers.length} presenter
                          {speakers.length !== 1 ? "s" : ""}
                        </span>
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
