import { describe, expect, it } from "vitest";
import {
  countdownTargetToDate,
  dateToCountdownTarget,
  formatEventDateBadge,
  updateBadgeDateText,
} from "../countdown";

describe("countdown helpers", () => {
  it("builds a midnight AEST countdown target from a date", () => {
    expect(dateToCountdownTarget("2026-06-01")).toBe("2026-06-01T00:00:00+10:00");
  });

  it("preserves time and offset from an existing target", () => {
    expect(dateToCountdownTarget("2027-05-20", "2026-05-25T09:30:00+11:00")).toBe(
      "2027-05-20T09:30:00+11:00"
    );
  });

  it("extracts YYYY-MM-DD from a countdown target", () => {
    expect(countdownTargetToDate("2026-05-25T00:00:00+10:00")).toBe("2026-05-25");
    expect(countdownTargetToDate(null)).toBe("");
  });

  it("formats badge dates in en-AU style", () => {
    expect(formatEventDateBadge("2026-05-25")).toBe("25 May 2026");
  });

  it("updates the date portion of badge text and keeps the location", () => {
    expect(updateBadgeDateText("25 May 2026 · Australia", "2027-06-01")).toBe(
      "1 June 2027 · Australia"
    );
    expect(updateBadgeDateText(undefined, "2026-05-25")).toBe("25 May 2026 · Australia");
  });
});
