"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Event {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  event_date: string | null;
  event_time: string;
  format: string;
  feature_image: string;
  status: string;
  published: boolean;
  is_free: boolean;
  price: string;
}

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "#F9FAFB", color: "#6B7280" },
  upcoming:  { bg: "#F0FDF4", color: "#16A34A" },
  live:      { bg: "#FEF2F2", color: "#DC2626" },
  past:      { bg: "#F9FAFB", color: "#6B7280" },
  cancelled: { bg: "#FFF7ED", color: "#EA580C" },
};

function formatDate(d: string | null) {
  if (!d) return "TBC";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminEventsPage() {
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((d) => { setEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = events.filter(
    (e) =>
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.slug.toLowerCase().includes(search.toLowerCase())
  );

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    setEvents((evs) => evs.map((e) => (e.id === id ? { ...e, published: !current } : e)));
  }

  async function deleteEvent(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    setEvents((evs) => evs.filter((e) => e.id !== id));
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Events</h1>
          <p className="swa-page-subtitle">{events.length} event{events.length !== 1 ? "s" : ""} · manage webinars, workshops and conferences</p>
        </div>
        <Link href="/admin/events/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Event
        </Link>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 360, marginBottom: 20 }}>
        <span className="material-symbols-outlined" style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: 18, color: "#9CA3AF",
        }}>search</span>
        <input
          type="search"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="swa-form-input"
          style={{ paddingLeft: 38 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 12 }}>hourglass_empty</span>
          Loading events…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 16 }}>event</span>
          <h3 style={{ color: "#1E1040", marginBottom: 8 }}>No events yet</h3>
          <p style={{ marginBottom: 20 }}>Create your first event to get started.</p>
          <Link href="/admin/events/new" className="swa-btn swa-btn--primary">Create an event</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((ev) => {
            const badge = STATUS_BADGE[ev.status] ?? STATUS_BADGE.draft;
            return (
              <div key={ev.id} style={{
                display: "grid", gridTemplateColumns: "72px 1fr auto",
                gap: 16, alignItems: "center",
                background: "#fff", border: "1px solid #E5E7EB",
                borderRadius: 12, padding: "14px 18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                {/* Thumbnail */}
                <div style={{ width: 72, height: 52, borderRadius: 8, overflow: "hidden", background: "#F3F4F6", flexShrink: 0 }}>
                  {ev.feature_image ? (
                    <Image src={ev.feature_image} alt={ev.title} width={72} height={52} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "1.4rem" }}>📅</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1E1040" }}>{ev.title}</span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                      background: badge.bg, color: badge.color, textTransform: "uppercase",
                    }}>{ev.status}</span>
                    {!ev.published && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: "#FFF7ED", color: "#EA580C", textTransform: "uppercase" }}>
                        Draft
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#9CA3AF", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>📅 {formatDate(ev.event_date)}</span>
                    {ev.event_time && <span>🕐 {ev.event_time}</span>}
                    <span style={{ textTransform: "capitalize" }}>📋 {ev.format}</span>
                    <span>{ev.is_free ? "🆓 Free" : `💳 ${ev.price}`}</span>
                    <span style={{ color: "#C4B5FD" }}>/events/{ev.slug}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <button
                    onClick={() => togglePublish(ev.id, ev.published)}
                    title={ev.published ? "Unpublish" : "Publish"}
                    className="swa-icon-btn"
                    style={{ color: ev.published ? "#16A34A" : "#9CA3AF" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {ev.published ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                  <a href={`/events/${ev.slug}`} target="_blank" rel="noopener noreferrer" className="swa-icon-btn" title="View on site">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
                  </a>
                  <Link href={`/admin/events/${ev.id}`} className="swa-icon-btn" title="Edit">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                  </Link>
                  <button onClick={() => deleteEvent(ev.id, ev.title)} className="swa-icon-btn" title="Delete" style={{ color: "#EF4444" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
