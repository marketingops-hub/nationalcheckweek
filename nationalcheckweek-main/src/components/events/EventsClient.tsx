"use client";

import { useState, useMemo } from "react";
import EventCard from "@/components/events/EventCard";
import CalendarView from "@/components/events/CalendarView";
import { formatDateMonth, type EventListItem } from "@/lib/events";

interface Props {
  events: EventListItem[];
}

export default function EventsClient({ events }: Props) {
  const [search, setSearch]   = useState("");
  const [view, setView]       = useState<"list" | "month" | "calendar">("list");
  const [filter, setFilter]   = useState<"upcoming" | "past" | "all">("all");

  const filtered = useMemo(() => events.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || e.title.toLowerCase().includes(q) || (e.tagline ?? "").toLowerCase().includes(q);
    const matchesFilter =
      filter === "all" ||
      (filter === "upcoming" && (e.status === "upcoming" || e.status === "live")) ||
      (filter === "past"     && e.status === "past");
    return matchesSearch && matchesFilter;
  }), [events, search, filter]);

  // Group by month for month view — sorted in descending order (most recent first)
  const byMonth = useMemo(() => {
    // Track the earliest event_date per month label so we can sort months
    const map: Record<string, EventListItem[]> = {};
    const sortKey: Record<string, string> = {};
    for (const ev of filtered) {
      const key = formatDateMonth(ev.event_date);
      if (!map[key]) {
        map[key] = [];
        sortKey[key] = ev.event_date ?? "9999-99";
      }
      map[key].push(ev);
    }
    // Return entries sorted by date in DESCENDING order (most recent first)
    return Object.entries(map).sort(([a], [b]) =>
      sortKey[b].localeCompare(sortKey[a])
    );
  }, [filtered]);

  return (
    <>
      {/* TOOLBAR */}
      <div className="events-toolbar">
        {/* Search */}
        <div className="events-toolbar__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="events-toolbar__search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="events-toolbar__search-input"
          />
        </div>

        {/* Filter pills */}
        <div className="events-toolbar__filters">
          {(["upcoming", "past", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`events-filter-btn${filter === f ? " events-filter-btn--active" : ""}`}
            >
              {f === "all" ? "All events" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="events-toolbar__views">
          <button
            onClick={() => setView("list")}
            className={`events-view-btn${view === "list" ? " events-view-btn--active" : ""}`}
            title="List view"
            aria-label="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="6"  x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6"  x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          <button
            onClick={() => setView("month")}
            className={`events-view-btn${view === "month" ? " events-view-btn--active" : ""}`}
            title="Month view"
            aria-label="Month view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`events-view-btn${view === "calendar" ? " events-view-btn--active" : ""}`}
            title="Calendar view"
            aria-label="Calendar view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
            </svg>
          </button>
        </div>
      </div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="events-empty">
          <div className="events-empty__icon">📅</div>
          <h3 className="events-empty__title">No events found</h3>
          <p>{search ? "Try a different search term." : "Check back soon for upcoming events."}</p>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && filtered.length > 0 && (
        <div className="events-list">
          {filtered.map((ev) => <EventCard key={ev.id} ev={ev} />)}
        </div>
      )}

      {/* MONTH VIEW */}
      {view === "month" && filtered.length > 0 && (
        <div className="events-by-month">
          {byMonth.map(([month, evs]) => (
            <div key={month} className="events-month-group">
              <h2 className="section-heading section-heading--md">{month}</h2>
              <div className="events-list">
                {evs.map((ev) => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === "calendar" && (
        <CalendarView events={filtered} />
      )}
    </>
  );
}
