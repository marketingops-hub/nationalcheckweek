"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { EventListItem } from "@/lib/events";

interface Props {
  events: EventListItem[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarView({ events }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: Array<{
      date: number;
      fullDate: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = daysInPrevMonth - i;
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      days.push({ date, fullDate, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      days.push({
        date,
        fullDate,
        isCurrentMonth: true,
        isToday: fullDate === todayStr
      });
    }

    // Next month days to fill grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      const fullDate = `${year}-${String(month + 2).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      days.push({ date, fullDate, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [year, month, firstDay, daysInMonth, daysInPrevMonth]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, EventListItem[]> = {};
    events.forEach(ev => {
      if (ev.event_date) {
        const dateKey = ev.event_date.split('T')[0]; // Get YYYY-MM-DD
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(ev);
      }
    });
    return map;
  }, [events]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="calendar-view">
      {/* Calendar Header */}
      <div className="calendar-header">
        <h2 className="calendar-header__title">
          {MONTHS[month]} {year}
        </h2>
        <div className="calendar-header__controls">
          <button onClick={goToToday} className="calendar-btn calendar-btn--today">
            Today
          </button>
          <button onClick={goToPrevMonth} className="calendar-btn" aria-label="Previous month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button onClick={goToNextMonth} className="calendar-btn" aria-label="Next month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Day headers */}
        {DAYS.map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, idx) => {
          const dayEvents = eventsByDate[day.fullDate] || [];
          return (
            <div
              key={idx}
              className={`calendar-day ${!day.isCurrentMonth ? 'calendar-day--other-month' : ''} ${day.isToday ? 'calendar-day--today' : ''}`}
            >
              <div className="calendar-day__number">{day.date}</div>
              <div className="calendar-day__events">
                {dayEvents.slice(0, 3).map(ev => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.slug}`}
                    className="calendar-event"
                    title={ev.title}
                  >
                    <span className="calendar-event__time">
                      {ev.event_time ? ev.event_time.slice(0, 5) : ''}
                    </span>
                    <span className="calendar-event__title">{ev.title}</span>
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <div className="calendar-event-more">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
