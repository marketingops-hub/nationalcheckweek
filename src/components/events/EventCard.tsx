import Link from "next/link";
import Image from "next/image";
import BadgePill from "@/components/events/BadgePill";
import {
  FORMAT_LABEL, FORMAT_BADGE, STATUS_BADGE,
  formatDateShort,
  type EventListItem,
} from "@/lib/events";

export default function EventCard({ ev }: { ev: EventListItem }) {
  const fmtBadge = FORMAT_BADGE[ev.format] ?? { bg: "#F9FAFB", color: "#374151" };
  const stsBadge = STATUS_BADGE[ev.status] ?? { bg: "#F9FAFB", color: "#374151" };

  return (
    <Link href={`/events/${ev.slug}`} className="event-card">
      <div className="event-card__image">
        {ev.feature_image ? (
          <Image src={ev.feature_image} alt={ev.title} fill style={{ objectFit: "cover" }} />
        ) : (
          <div className="event-card__image-placeholder">📅</div>
        )}
        {ev.status === "live" && (
          <div className="event-card__live-badge">● LIVE</div>
        )}
      </div>

      <div className="event-card__body">
        <div className="event-card__badges">
          <BadgePill {...fmtBadge} label={FORMAT_LABEL[ev.format] ?? ev.format} />
          <BadgePill {...stsBadge} label={ev.status} />
          <BadgePill
            bg={ev.is_free ? "#F0FDF4" : "#FFF7ED"}
            color={ev.is_free ? "#16A34A" : "#EA580C"}
            label={ev.is_free ? "Free" : (ev.price ?? "Paid")}
          />
        </div>

        <h3 className="event-card__title">{ev.title}</h3>
        {ev.tagline && <p className="event-card__tagline">{ev.tagline}</p>}

        <div className="event-card__meta">
          {ev.event_date && <span>📅 {formatDateShort(ev.event_date)}</span>}
          {ev.event_time && (
            <span>🕐 {ev.event_time}{ev.event_end ? ` – ${ev.event_end}` : ""}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
