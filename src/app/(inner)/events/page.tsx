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
  event_end: string;
  format: string;
  feature_image: string;
  status: string;
  is_free: boolean;
  price: string;
  register_url: string;
}

const FORMAT_LABEL: Record<string, string> = {
  webinar: "Webinar",
  "in-person": "In Person",
  hybrid: "Hybrid",
  workshop: "Workshop",
  conference: "Conference",
};

const FORMAT_COLOR: Record<string, string> = {
  webinar:      "#EFF6FF;color:#2563EB",
  "in-person":  "#F0FDF4;color:#16A34A",
  hybrid:       "#FFF7ED;color:#EA580C",
  workshop:     "#F5F3FF;color:#7C3AED",
  conference:   "#FEF2F2;color:#DC2626",
};

const STATUS_COLOR: Record<string, string> = {
  upcoming:  "#F0FDF4;color:#16A34A",
  live:      "#FEF2F2;color:#DC2626",
  past:      "#F9FAFB;color:#6B7280",
  cancelled: "#FFF7ED;color:#EA580C",
};

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function BadgePill({ style, label }: { style: string; label: string }) {
  const [bg, color] = style.split(";color:");
  return (
    <span style={{
      background: bg.replace("background:", "").trim(),
      color,
      fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px",
      borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {label}
    </span>
  );
}

export default function EventsPage() {
  const [events, setEvents]     = useState<Event[]>([]);
  const [search, setSearch]     = useState("");
  const [view, setView]         = useState<"list" | "month">("list");
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => { setEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) => {
    const matchesSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.tagline.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "upcoming" && (e.status === "upcoming" || e.status === "live")) ||
      (filter === "past" && e.status === "past");
    return matchesSearch && matchesFilter;
  });

  // Group by month for month view
  const byMonth: Record<string, Event[]> = {};
  for (const ev of filtered) {
    const key = ev.event_date
      ? new Date(ev.event_date).toLocaleDateString("en-AU", { month: "long", year: "numeric" })
      : "Date TBC";
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(ev);
  }

  return (
    <>
      {/* PAGE HERO */}
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner" style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="section-tag" style={{ margin: "0 auto 16px" }}>
            Webinars · Workshops · Conferences
          </div>
          <h1 className="page-hero__title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            Events
          </h1>
          <p className="page-hero__subtitle" style={{ margin: "0 auto" }}>
            Join our expert-led events on student wellbeing, emotional literacy, and data-driven school improvement.
            Live webinars, workshops, and conferences designed for educators and school leaders.
          </p>
        </div>
      </div>

      <main id="main-content" className="inner-content inner-content--wide">

        {/* TOOLBAR */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 32 }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px 10px 38px",
                border: "1px solid var(--border)", borderRadius: 8,
                fontSize: "0.9rem", color: "var(--navy)", background: "var(--white)",
                outline: "none",
              }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--gray-100)", borderRadius: 8, padding: 4 }}>
            {(["upcoming", "past", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: "0.82rem", fontWeight: 600,
                background: filter === f ? "var(--white)" : "transparent",
                color: filter === f ? "var(--navy)" : "var(--text-light)",
                boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                textTransform: "capitalize",
              }}>{f === "all" ? "All events" : f}</button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 4, background: "var(--gray-100)", borderRadius: 8, padding: 4 }}>
            <button onClick={() => setView("list")} title="List view" style={{
              padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: view === "list" ? "var(--white)" : "transparent",
              color: view === "list" ? "var(--teal)" : "var(--text-light)",
              boxShadow: view === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button onClick={() => setView("month")} title="Month view" style={{
              padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: view === "month" ? "var(--white)" : "transparent",
              color: view === "month" ? "var(--teal)" : "var(--text-light)",
              boxShadow: view === "month" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-light)" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>⏳</div>
            <p>Loading events…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-light)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>📅</div>
            <h3 style={{ color: "var(--navy)", marginBottom: 8 }}>No events found</h3>
            <p>{search ? "Try a different search term." : "Check back soon for upcoming events."}</p>
          </div>
        )}

        {/* LIST VIEW */}
        {!loading && view === "list" && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {filtered.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        )}

        {/* MONTH VIEW */}
        {!loading && view === "month" && filtered.length > 0 && (
          <div>
            {Object.entries(byMonth).map(([month, evs]) => (
              <div key={month} style={{ marginBottom: 48 }}>
                <h2 className="section-heading section-heading--md">{month}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {evs.map((ev) => <EventCard key={ev.id} ev={ev} />)}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </>
  );
}

function EventCard({ ev }: { ev: Event }) {
  return (
    <Link href={`/events/${ev.slug}`} style={{ textDecoration: "none" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "200px 1fr",
        border: "1px solid var(--border)", borderRadius: 14,
        overflow: "hidden", background: "var(--white)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.15s, transform 0.15s",
        cursor: "pointer",
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", background: "var(--gray-100)", minHeight: 160 }}>
          {ev.feature_image ? (
            <Image src={ev.feature_image} alt={ev.title} fill style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "2.5rem" }}>
              📅
            </div>
          )}
          {ev.status === "live" && (
            <div style={{
              position: "absolute", top: 10, left: 10,
              background: "#DC2626", color: "#fff", fontSize: "0.7rem", fontWeight: 800,
              padding: "3px 10px", borderRadius: 100, textTransform: "uppercase",
              animation: "pulse 2s infinite",
            }}>● LIVE</div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <BadgePill style={FORMAT_COLOR[ev.format] ?? "background:#F9FAFB;color:#374151"} label={FORMAT_LABEL[ev.format] ?? ev.format} />
            <BadgePill style={STATUS_COLOR[ev.status] ?? "background:#F9FAFB;color:#374151"} label={ev.status} />
            <BadgePill
              style={ev.is_free ? "background:#F0FDF4;color:#16A34A" : "background:#FFF7ED;color:#EA580C"}
              label={ev.is_free ? "Free" : ev.price}
            />
          </div>

          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 6, lineHeight: 1.35 }}>
            {ev.title}
          </h3>
          {ev.tagline && (
            <p style={{ fontSize: "0.88rem", color: "var(--text-mid)", marginBottom: 12, lineHeight: 1.55 }}>
              {ev.tagline}
            </p>
          )}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.82rem", color: "var(--text-light)" }}>
            {ev.event_date && (
              <span>📅 {formatDate(ev.event_date)}</span>
            )}
            {ev.event_time && (
              <span>🕐 {ev.event_time}{ev.event_end ? ` – ${ev.event_end}` : ""}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
