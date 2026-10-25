import { describe, expect, it } from "vitest";
import { isValidEntityKey, pathsToRevalidate, publishContentSchemas, publicPath } from "../entities";
import { safeSourceUrl, sourceLabel } from "../format";
import { groupChunks, looseQuery, type RetrievedChunk } from "../group";
import { changedFields, parseModelOutput, reconcileStateIssues } from "../prompt";

describe("entity keys", () => {
  it("validates area and state_issue keys", () => {
    expect(isValidEntityKey("area", "melbourne")).toBe(true);
    expect(isValidEntityKey("area", "mel/bourne")).toBe(false);
    expect(isValidEntityKey("state_issue", "victoria/bullying")).toBe(true);
    expect(isValidEntityKey("state_issue", "victoria")).toBe(false);
    expect(isValidEntityKey("state_issue", "victoria/../x")).toBe(false);
    expect(isValidEntityKey("area", "Melbourne")).toBe(false);
  });

  it("maps keys to public paths to revalidate", () => {
    expect(pathsToRevalidate("area", "melbourne")).toEqual(["/areas/melbourne"]);
    expect(pathsToRevalidate("state_issue", "victoria/bullying")).toEqual([
      "/states/victoria/issues/bullying",
      "/states/victoria",
    ]);
    expect(publicPath("state_issue", "victoria/bullying")).toBe("/states/victoria/issues/bullying");
  });
});

describe("publish content validation", () => {
  it("accepts any non-empty subset of fields", () => {
    expect(publishContentSchemas.area.safeParse({ overview: "New overview" }).success).toBe(true);
    expect(publishContentSchemas.state_issue.safeParse({ stat: "1 in 4", desc: "Text" }).success).toBe(true);
  });

  it("rejects empty, unknown or oversized fields", () => {
    expect(publishContentSchemas.area.safeParse({}).success).toBe(false);
    expect(publishContentSchemas.area.safeParse({ overview: "x", hacked: 1 }).success).toBe(false);
    expect(publishContentSchemas.state_issue.safeParse({ stat: "x".repeat(201) }).success).toBe(false);
    expect(publishContentSchemas.area.safeParse({ key_stats: [] }).success).toBe(false);
  });
});

describe("source formatting", () => {
  it("only links http(s) URLs", () => {
    expect(safeSourceUrl("https://www.aihw.gov.au/report")).toBe("https://www.aihw.gov.au/report");
    expect(safeSourceUrl("javascript:alert(1)")).toBeNull();
    expect(safeSourceUrl("file:///etc/passwd")).toBeNull();
    expect(safeSourceUrl("")).toBeNull();
    expect(safeSourceUrl(null)).toBeNull();
  });

  it("prefers an explicit reference, else composes one", () => {
    expect(sourceLabel({ title: "T", reference: "AIHW. Youth mental health. 2024" })).toBe("AIHW. Youth mental health. 2024");
    expect(sourceLabel({ title: "Youth mental health", author: "AIHW", year: 2024, publisher: "AIHW" })).toBe(
      "AIHW (2024). Youth mental health. AIHW",
    );
    expect(sourceLabel({ title: "Plain title" })).toBe("Plain title");
    expect(sourceLabel({ title: "Report", page_ref: "p. 14" })).toBe("Report, p. 14");
  });
});

const chunk = (doc: string, n: number, len = 50): RetrievedChunk => ({
  document_id: doc,
  document_title: `Doc ${doc}`,
  content: `${doc}-${n} `.padEnd(len, "x"),
});

describe("groupChunks", () => {
  it("keeps document order by best chunk and caps docs and chunks per doc", () => {
    const rows = [chunk("a", 1), chunk("b", 1), chunk("a", 2), chunk("a", 3), chunk("a", 4), chunk("a", 5), chunk("c", 1)];
    const out = groupChunks(rows, { maxDocs: 2, perDoc: 3 });
    expect(out.map((d) => d.document_id)).toEqual(["a", "b"]);
    expect(out[0].chunks).toHaveLength(3);
  });

  it("enforces the total character budget", () => {
    const rows = Array.from({ length: 12 }, (_, i) => chunk(`d${i % 3}`, i, 1000));
    const out = groupChunks(rows, { maxDocs: 3, perDoc: 4, maxTotalChars: 5000 });
    const total = out.reduce((n, d) => n + d.chunks.reduce((m, c) => m + c.content.length, 0), 0);
    expect(total).toBeLessThanOrEqual(5000);
    expect(out.length).toBeGreaterThan(0);
  });

  it("skips empty chunks", () => {
    expect(groupChunks([{ ...chunk("a", 1), content: "   " }])).toEqual([]);
  });
});

describe("looseQuery", () => {
  it("joins significant words with OR", () => {
    expect(looseQuery("Bullying in Victoria: students & stats")).toBe("bullying or victoria or students or stats");
  });
});

describe("parseModelOutput", () => {
  const stateIssue = JSON.stringify({ content: { stat: "1 in 4 students", desc: "Text (Source: Doc A)" }, sources_used: [1, 2, 9, "x", 1] });

  it("parses fenced JSON and keeps only valid, unique source numbers", () => {
    const out = parseModelOutput("```json\n" + stateIssue + "\n```", "state_issue", 2);
    expect(out.content).toEqual({ stat: "1 in 4 students", desc: "Text (Source: Doc A)" });
    expect(out.sourcesUsed).toEqual([1, 2]);
  });

  it("rejects invalid JSON, missing fields and extra fields", () => {
    expect(() => parseModelOutput("nope", "state_issue", 1)).toThrow(/unreadable/);
    expect(() => parseModelOutput(JSON.stringify({ content: { stat: "x" } }), "state_issue", 1)).toThrow(/not valid/);
    expect(() =>
      parseModelOutput(JSON.stringify({ content: { stat: "x", desc: "y", extra: "z" } }), "state_issue", 1),
    ).toThrow(/not valid/);
  });
});

describe("changedFields", () => {
  it("ignores whitespace-only differences", () => {
    expect(changedFields("state_issue", { stat: "1 in 4", desc: "A" }, { stat: " 1 in 4 ", desc: "B" })).toEqual(["desc"]);
    expect(
      changedFields("area", { overview: "o", prevention: "p", key_stats: [{ num: "1", label: "a" }] }, { overview: "o", prevention: "p", key_stats: [{ num: "1", label: "a" }] }),
    ).toEqual([]);
  });
});

describe("state and issue pages", () => {
  it("validates their keys, paths and publishable fields", () => {
    expect(isValidEntityKey("state", "victoria")).toBe(true);
    expect(isValidEntityKey("state", "victoria/bullying")).toBe(false);
    expect(isValidEntityKey("issue", "school-refusal")).toBe(true);
    expect(pathsToRevalidate("state", "victoria")).toEqual(["/states/victoria"]);
    expect(pathsToRevalidate("issue", "bullying")).toEqual(["/issues/bullying"]);
    expect(publicPath("issue", "bullying")).toBe("/issues/bullying");

    expect(publishContentSchemas.issue.safeParse({ anchor_stat: "1 in 5" }).success).toBe(true);
    expect(publishContentSchemas.issue.safeParse({ anchor_stat: "1 in 5", badge: "x" }).success).toBe(false);
    expect(
      publishContentSchemas.state.safeParse({ issues: [{ name: "Bullying", stat: "1 in 5", desc: "Text" }] }).success,
    ).toBe(true);
    expect(publishContentSchemas.state.safeParse({ issues: [] }).success).toBe(false);
  });

  it("parses a state proposal and a national issue proposal", () => {
    const state = JSON.stringify({
      content: { subtitle: "Sub", issues: [{ name: "Bullying", stat: "1 in 5", desc: "D" }] },
      sources_used: [1],
    });
    expect(parseModelOutput(state, "state", 1).content.subtitle).toBe("Sub");

    const issue = JSON.stringify({
      content: { short_desc: "a", definition: "b", australian_data: "c", mechanisms: "d", anchor_stat: "e" },
      sources_used: [],
    });
    expect(parseModelOutput(issue, "issue", 3).sourcesUsed).toEqual([]);
    expect(() => parseModelOutput(JSON.stringify({ content: { short_desc: "a" } }), "issue", 1)).toThrow(/not valid/);
  });
});

describe("reconcileStateIssues", () => {
  const current = [
    { name: "Bullying", stat: "old1", desc: "oldd1" },
    { name: "Sleep", stat: "old2", desc: "oldd2" },
    { name: "Anxiety", stat: "old3", desc: "oldd3" },
  ];

  it("keeps the existing list, order and names; only matched cards change", () => {
    const out = reconcileStateIssues(current, [
      { name: "sleep", stat: "new2", desc: "newd2" },
      { name: "Invented issue", stat: "x", desc: "y" },
    ]);
    expect(out).toEqual([
      { name: "Bullying", stat: "old1", desc: "oldd1" },
      { name: "Sleep", stat: "new2", desc: "newd2" },
      { name: "Anxiety", stat: "old3", desc: "oldd3" },
    ]);
  });

  it("detects a change in any card", () => {
    const proposed = reconcileStateIssues(current, [{ name: "Anxiety", stat: "new3", desc: "oldd3" }]);
    expect(changedFields("state", { subtitle: "s", issues: current }, { subtitle: "s", issues: proposed })).toEqual(["issues"]);
    expect(changedFields("state", { subtitle: "s", issues: current }, { subtitle: "s", issues: reconcileStateIssues(current, []) })).toEqual([]);
  });
});
