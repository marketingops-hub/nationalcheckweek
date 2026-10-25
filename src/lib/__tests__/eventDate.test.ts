import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createStaticClient: () => null }));

import { applyCopyrightYear, applyEventYear, formatLongDate, parseNextEvent } from "../eventDate";

describe("parseNextEvent", () => {
  it("derives year and formatted date from the countdown target", () => {
    expect(parseNextEvent("2027-07-27T00:00:00+10:00")).toEqual({
      iso: "2027-07-27T00:00:00+10:00",
      ymd: "2027-07-27",
      year: 2027,
      formatted: "27 July 2027",
    });
  });

  it("returns null for missing or invalid targets", () => {
    expect(parseNextEvent(undefined)).toBeNull();
    expect(parseNextEvent("soon")).toBeNull();
  });
});

describe("formatLongDate", () => {
  it("does not drift across the year boundary", () => {
    expect(formatLongDate("2027-01-01")).toBe("1 January 2027");
  });
});

describe("applyEventYear", () => {
  it("rewrites National Check-in Week year variants", () => {
    expect(applyEventYear("Register for National Check-In Week 2026", 2027)).toBe("Register for National Check-In Week 2027");
    expect(applyEventYear("Register - National Check-In Week 2026 | NCIW", 2027)).toBe("Register - National Check-In Week 2027 | NCIW");
  });

  it("replaces {year} tokens and leaves unrelated years alone", () => {
    expect(applyEventYear("NCIW {year}", 2027)).toBe("NCIW 2027");
    expect(applyEventYear("RoGS 2026 data", 2027)).toBe("RoGS 2026 data");
  });

  it("passes through null and empty values", () => {
    expect(applyEventYear(null, 2027)).toBeNull();
    expect(applyEventYear("", 2027)).toBe("");
  });
});

describe("applyCopyrightYear", () => {
  it("sets the current year from a token or an old year", () => {
    expect(applyCopyrightYear("Copyright © {year} NCIW", 2027)).toBe("Copyright © 2027 NCIW");
    expect(applyCopyrightYear("Copyright © 2026 NCIW", 2027)).toBe("Copyright © 2027 NCIW");
    expect(applyCopyrightYear("© 2024-2026 NCIW", 2027)).toBe("© 2027 NCIW");
  });
});
