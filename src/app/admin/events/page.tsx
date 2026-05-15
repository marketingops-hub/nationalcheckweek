"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { STATUS_BADGE, FORMAT_LABEL, formatDateShort } from "@/lib/events";
import { adminFetch } from "@/lib/adminFetch";

const PAGE_SIZE = 20;

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

export default function AdminEventsPage() {
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminFetch("/api/admin/events")
      .then((r) => r.json())
      .then((d) => { setEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filtered = useMemo(() => events.filter((e) => {
    const matchSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "published" && e.published) ||
      (statusFilter === "draft" && !e.published) ||
      e.status === statusFilter;
    return matchSearch && matchStatus;
  }), [events, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const STATUS_TABS = [
    { id: "all",       label: "All",       count: events.length },
    { id: "published", label: "Published", count: events.filter(e => e.published).length },
    { id: "draft",     label: "Drafts",    count: events.filter(e => !e.published).length },
    { id: "upcoming",  label: "Upcoming",  count: events.filter(e => e.status === "upcoming").length },
    { id: "past",      label: "Past",      count: events.filter(e => e.status === "past").length },
  ];

  async function togglePublish(id: string, current: boolean) {
    setEvents((evs) => evs.map((e) => (e.id === id ? { ...e, published: !current } : e)));
    const res = await adminFetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    if (!res.ok) {
      setEvents((evs) => evs.map((e) => (e.id === id ? { ...e, published: current } : e)));
      setError("Failed to update publish status. Please try again.");
    }
  }

  async function deleteEvent(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const prev = events;
    setEvents((evs) => evs.filter((e) => e.id !== id));
    const res = await adminFetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setEvents(prev);
      setError("Failed to delete event. Please try again.");
    }
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Events</h1>
          <p className="swa-page-subtitle">{loading ? "Loading…" : `${events.length} event${events.length !== 1 ? "s" : ""}`} · manage webinars, workshops and conferences</p>
        </div>
        <Link href="/admin/events/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Event
        </Link>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #E5E7EB", paddingBottom: 0 }}>
        {STATUS_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            style={{
              padding: "8px 14px", fontSize: 13, fontWeight: statusFilter === t.id ? 700 : 500,
              border: "none", background: "transparent", cursor: "pointer",
              color: statusFilter === t.id ? "var(--color-primary)" : "var(--color-text-muted)",
              borderBottom: statusFilter === t.id ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: -1, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 11, padding: "1px 6px", borderRadius: 100, fontWeight: 700,
              background: statusFilter === t.id ? "var(--color-primary)" : "#F3F4F6",
              color: statusFilter === t.id ? "#fff" : "var(--color-text-muted)",
            }}>{t.count}</span>
          </button>
        ))}
      </div>

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
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paginated.map((ev) => {
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#D1D5DB" }}>event</span>
                    </div>
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
                  <div style={{ fontSize: "0.78rem", color: "#9CA3AF", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_today</span>
                      {formatDateShort(ev.event_date)}
                    </span>
                    {ev.event_time && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                        {ev.event_time}
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>category</span>
                      {FORMAT_LABEL[ev.format] ?? ev.format}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{ev.is_free ? "redeem" : "payments"}</span>
                      {ev.is_free ? "Free" : ev.price}
                    </span>
                    <span style={{ color: "#C4B5FD", display: "flex", alignItems: "center", gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>link</span>
                      /events/{ev.slug}
                    </span>
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
          {/* Pagination footer */}
          {totalPages > 1 && (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>{filtered.length} events · page {page} of {totalPages}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="swa-icon-btn" style={{ opacity: page === 1 ? 0.4 : 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="swa-icon-btn" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
