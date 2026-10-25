import { cache } from "react";
import { createStaticClient } from "@/lib/supabase/server";
import { countdownTargetToDate } from "@/lib/countdown";

/**
 * Single source of truth for "when is the next National Check-in Week".
 *
 * It is the hero block's countdown target (homepage_blocks.content.countdownTarget),
 * i.e. the same value that drives the homepage countdown, so editing the
 * countdown in the admin updates every page that uses this helper.
 */
export interface NextEvent {
  /** ISO-8601 countdown target, e.g. 2027-07-27T00:00:00+10:00 */
  iso: string;
  /** YYYY-MM-DD */
  ymd: string;
  year: number;
  /** "27 July 2027" */
  formatted: string;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

/** Format YYYY-MM-DD as "27 July 2027" (en-AU), without timezone drift. */
export function formatLongDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function parseNextEvent(iso: string | null | undefined): NextEvent | null {
  const ymd = countdownTargetToDate(iso);
  if (!iso || !ymd) return null;
  return { iso, ymd, year: Number(ymd.slice(0, 4)), formatted: formatLongDate(ymd) };
}

/** Next event date from the database; null when it is missing or unreadable. */
export const getNextEvent = cache(async (): Promise<NextEvent | null> => {
  try {
    const sb = createStaticClient();
    if (!sb) return null;
    const { data } = await sb
      .from("homepage_blocks")
      .select("content")
      .eq("block_type", "hero")
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    return parseNextEvent((data?.content as { countdownTarget?: string } | null)?.countdownTarget);
  } catch {
    return null;
  }
});

/** Year of the next event, falling back to the current year. */
export async function getEventYear(): Promise<number> {
  return (await getNextEvent())?.year ?? currentYear();
}

const NCIW_YEAR_RE = /(National\s+Check-?in\s+Week)(\s+|\s*[-–—]\s*)?(20\d{2})\b/gi;

/**
 * Keep CMS copy in step with the event year. Replaces `{year}` and any
 * "National Check-in Week 20xx" with the given year, so existing content that
 * still says 2026 renders correctly without a database edit.
 */
export function applyEventYear<T extends string | null | undefined>(text: T, year: number): T {
  if (!text) return text;
  return text
    .replace(/\{\{?\s*year\s*\}?\}/gi, String(year))
    .replace(NCIW_YEAR_RE, (_m, name: string, sep: string | undefined) => `${name}${sep ?? " "}${year}`) as T;
}

/** Footer copyright: `{year}` token, or any "© 20xx" / "Copyright © 20xx", becomes the current year. */
export function applyCopyrightYear(text: string, year: number = currentYear()): string {
  return text
    .replace(/\{\{?\s*year\s*\}?\}/gi, String(year))
    .replace(/(©\s*)20\d{2}(?:\s*[-–]\s*20\d{2})?/g, `$1${year}`);
}
