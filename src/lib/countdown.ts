/**
 * Helpers for syncing the hero event date with the countdown target.
 * Countdown targets use Australian Eastern offset (+10:00) to match
 * existing NCIW homepage content (event day starts at midnight AEST).
 */

const DEFAULT_TIME = "00:00:00";
const DEFAULT_TZ_OFFSET = "+10:00";

/** Build an ISO countdown target from a YYYY-MM-DD date, preserving time/offset when present. */
export function dateToCountdownTarget(dateYmd: string, existingTarget?: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) return existingTarget ?? "";

  if (existingTarget) {
    const match = existingTarget.match(/T(\d{2}:\d{2}:\d{2})([+-]\d{2}:\d{2}|Z)?/);
    if (match) {
      const time = match[1];
      const offset = match[2] && match[2] !== "Z" ? match[2] : DEFAULT_TZ_OFFSET;
      return `${dateYmd}T${time}${offset}`;
    }
  }

  return `${dateYmd}T${DEFAULT_TIME}${DEFAULT_TZ_OFFSET}`;
}

/** Extract YYYY-MM-DD from a countdown ISO string. */
export function countdownTargetToDate(target?: string | null): string {
  if (!target) return "";
  const match = target.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

/** Format YYYY-MM-DD as "25 May 2026" (en-AU). */
export function formatEventDateBadge(dateYmd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) return dateYmd;
  const [y, m, d] = dateYmd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Update the date portion of a badge like "25 May 2026 · Australia",
 * keeping the location segment after " · ".
 */
export function updateBadgeDateText(badgeText: string | undefined, dateYmd: string): string {
  const formatted = formatEventDateBadge(dateYmd);
  if (!badgeText?.trim()) return `${formatted} · Australia`;
  if (badgeText.includes(" · ")) {
    const location = badgeText.split(" · ").slice(1).join(" · ");
    return `${formatted} · ${location}`;
  }
  return formatted;
}
