// ─── Shared types + constants for the Events feature ───

export interface Speaker {
  id?: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
  sort_order: number;
}

export interface EventRecord {
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
  published: boolean;
  seo_title: string;
  seo_desc: string;
  event_speakers?: Speaker[];
}

export type EventListItem = Pick<
  EventRecord,
  "id" | "slug" | "title" | "tagline" | "event_date" | "event_time" | "event_end"
  | "format" | "feature_image" | "status" | "is_free" | "price" | "register_url"
>;

export const FORMAT_LABEL: Record<string, string> = {
  webinar:      "Webinar",
  "in-person":  "In Person",
  hybrid:       "Hybrid",
  workshop:     "Workshop",
  conference:   "Conference",
};

export const FORMAT_BADGE: Record<string, { bg: string; color: string }> = {
  webinar:      { bg: "#EFF6FF", color: "#2563EB" },
  "in-person":  { bg: "#F0FDF4", color: "#16A34A" },
  hybrid:       { bg: "#FFF7ED", color: "#EA580C" },
  workshop:     { bg: "#F5F3FF", color: "#7C3AED" },
  conference:   { bg: "#FEF2F2", color: "#DC2626" },
};

export const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "#F9FAFB", color: "#6B7280" },
  upcoming:  { bg: "#F0FDF4", color: "#16A34A" },
  live:      { bg: "#FEF2F2", color: "#DC2626" },
  past:      { bg: "#F3F4F6", color: "#6B7280" },
  cancelled: { bg: "#FFF7ED", color: "#EA580C" },
};

export const FORMATS = ["webinar", "in-person", "hybrid", "workshop", "conference"] as const;
export const STATUSES = ["draft", "upcoming", "live", "past", "cancelled"] as const;

/**
 * Parse a YYYY-MM-DD date string without timezone shift.
 * new Date("2026-04-15") → UTC midnight → wrong day in +10/+11 zones.
 */
export function parseLocalDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function formatDateShort(d: string | null): string {
  if (!d) return "TBC";
  return parseLocalDate(d).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function formatDateLong(d: string | null): string {
  if (!d) return "";
  return parseLocalDate(d).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function formatDateMonth(d: string | null): string {
  if (!d) return "Date TBC";
  return parseLocalDate(d).toLocaleDateString("en-AU", {
    month: "long", year: "numeric",
  });
}
