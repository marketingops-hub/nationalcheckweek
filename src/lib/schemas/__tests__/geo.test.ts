import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseImpacts,
  parseGroups,
  parseStateIssues,
  parseAreaIssues,
  parseKeyStats,
} from "../geo";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("geo schema parsers", () => {
  it("parses valid impacts", () => {
    const input = [{ title: "Sleep", text: "Disrupted sleep patterns." }];
    expect(parseImpacts(input)).toEqual(input);
  });

  it("returns [] for null/undefined", () => {
    expect(parseImpacts(null)).toEqual([]);
    expect(parseImpacts(undefined)).toEqual([]);
    expect(parseGroups(undefined)).toEqual([]);
  });

  it("returns [] and logs on malformed impacts", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseImpacts([{ title: "missing text" }])).toEqual([]);
    expect(spy).toHaveBeenCalled();
  });

  it("returns [] when given a non-array", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseGroups("not-an-array")).toEqual([]);
    expect(spy).toHaveBeenCalled();
  });

  it("parses state issues with optional slug", () => {
    const input = [{ name: "Anxiety", badge: "badge-critical", stat: "1 in 7", desc: "…" }];
    expect(parseStateIssues(input)).toEqual(input);
  });

  it("parses area issues and key stats", () => {
    expect(parseAreaIssues([{ title: "X", severity: "high", stat: "10%", desc: "…" }])).toHaveLength(1);
    expect(parseKeyStats([{ num: "42", label: "schools" }])).toHaveLength(1);
  });

  it("keeps valid groups (string array)", () => {
    expect(parseGroups(["LGBTQ+ youth", "Rural students"])).toEqual([
      "LGBTQ+ youth",
      "Rural students",
    ]);
  });
});
