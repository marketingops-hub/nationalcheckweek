import { describe, expect, it } from "vitest";
import { FIELDS, FIELD_LABELS, isValidEntityKey, pathsToRevalidate, publishContentSchemas, publicPath } from "../entities";
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
      content: {
        short_desc: "a", definition: "b", australian_data: "c", mechanisms: "d", anchor_stat: "e",
        impacts: [{ title: "Sleep", text: "Disrupts sleep." }],
        groups: ["Girls aged 10-17"],
      },
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

import { describeAiError } from "../aiError";

describe("describeAiError", () => {
  const apiError = (status: number, message: string) => ({
    details: { originalError: { status, message: `${status} ${message}`, error: { error: { message } } } },
  });

  it("explains an empty AI balance", () => {
    expect(describeAiError(apiError(400, "Your credit balance is too low to access the Anthropic API."))).toMatch(/run out of credit/);
  });

  it("explains key and model problems", () => {
    expect(describeAiError(apiError(401, "invalid x-api-key"))).toMatch(/API key/);
    expect(describeAiError(apiError(404, "model: claude-x not found"))).toMatch(/model is not available/);
  });

  it("falls back to the real reason for anything else", () => {
    expect(describeAiError(apiError(400, "messages: text content blocks must be non-empty"))).toMatch(
      /AI request failed: messages: text content blocks must be non-empty/,
    );
    expect(describeAiError(new Error("boom"))).toBe("The AI request failed: boom");
  });
});

import { normalizeText, quoteInText, reviewEvidence, stripCitations, unsupportedFigures } from "../evidence";
import { PatchDocumentSchema } from "../../vault/schemas";

describe("quote verification", () => {
  const text = "The eSafety Commissioner’s research found 53% of 10–17 year olds had experienced cyberbullying — and 38% in the past 12 months.";

  it("matches quotes ignoring case, spacing and curly quotes/dashes", () => {
    expect(quoteInText("the esafety commissioner's research found 53% of 10-17 year olds", text)).toBe(true);
    expect(quoteInText("53%  of 10–17   year olds had experienced cyberbullying", text)).toBe(true);
  });

  it("rejects invented or too-short quotes", () => {
    expect(quoteInText("more than half of Australian 15-year-olds report bullying", text)).toBe(false);
    expect(quoteInText("53%", text)).toBe(false);
  });

  it("normalizes text", () => {
    expect(normalizeText("  A  “Quote” – x ")).toBe('a "quote" - x');
  });
});

describe("unsupported figures", () => {
  const excerpts = "Results: 38% of students (1,200 schools) reported it. Rate rose 4.5 points.";

  it("flags new figures missing from the excerpts, ignoring citations and old numbers", () => {
    expect(unsupportedFigures("38% reported it (Source: Report 2026 edition)", "", excerpts)).toEqual([]);
    expect(unsupportedFigures("53% reported it, 1200 schools", "", excerpts)).toEqual(["53%"]);
    expect(unsupportedFigures("It affects 53% of students", "53% of students", excerpts)).toEqual([]);
    expect(unsupportedFigures("up 4.5 points", "", excerpts)).toEqual([]);
  });

  it("strips citations", () => {
    expect(stripCitations("A fact (Source: Doc 2025). Another.").includes("2025")).toBe(false);
  });
});

describe("reviewEvidence", () => {
  const docs = [
    { document_id: "d1", chunks: [{ chunk_page: 14, chunk_heading: "Bullying", content: "More than half of 15-year-olds reported bullying in 2025 according to PISA." }] },
    { document_id: "d2", chunks: [{ chunk_page: null, chunk_heading: null, content: "Unrelated text about attendance rates in remote areas." }] },
  ];
  const describe_ = (id: string) => ({ label: `Doc ${id}`, url: id === "d1" ? "https://x.org/r" : null });

  it("verifies a quote, credits the right document, and records page and heading", () => {
    const out = reviewEvidence({
      changed: ["anchor_stat"],
      fieldLabels: FIELD_LABELS,
      current: { anchor_stat: "old" },
      proposed: { anchor_stat: "More than half of 15-year-olds reported bullying" },
      docs,
      // model named document 2, but the quote is really in document 1
      raw: { anchor_stat: [{ source: 2, quote: "More than half of 15-year-olds reported bullying in 2025" }] },
      describe: describe_,
    });
    expect(out.evidence.anchor_stat[0]).toMatchObject({ sourceId: "d1", verified: true, page: 14, heading: "Bullying", url: "https://x.org/r" });
    expect(out.warnings).toEqual([]);
  });

  it("warns about missing evidence, unverified quotes and untraceable figures", () => {
    const out = reviewEvidence({
      changed: ["anchor_stat", "definition"],
      fieldLabels: FIELD_LABELS,
      current: { anchor_stat: "old", definition: "old" },
      proposed: { anchor_stat: "77% of students", definition: "text" },
      docs,
      raw: { anchor_stat: [{ source: 1, quote: "this sentence is not in any document at all" }] },
      describe: describe_,
    });
    expect(out.evidence.anchor_stat[0].verified).toBe(false);
    expect(out.evidence.definition).toEqual([]);
    expect(out.unsupported.anchor_stat).toEqual(["77%"]);
    expect(out.warnings.join(" ")).toMatch(/no supporting quote/);
    expect(out.warnings.join(" ")).toMatch(/could not be found word-for-word/);
    expect(out.warnings.join(" ")).toMatch(/77%/);
  });
});

describe("vault source_url validation", () => {
  it("accepts blank (to clear) and http(s) links; rejects anything else", () => {
    expect(PatchDocumentSchema.safeParse({ source_url: "https://www.aihw.gov.au/report" }).success).toBe(true);
    expect(PatchDocumentSchema.safeParse({ source_url: "" }).success).toBe(true);
    expect(PatchDocumentSchema.safeParse({ source_url: "javascript:alert(1)" }).success).toBe(false);
    expect(PatchDocumentSchema.safeParse({ source_url: "aihw.gov.au/report" }).success).toBe(false);
    expect(PatchDocumentSchema.safeParse({ source_url: "https://" }).success).toBe(false);
  });
});

import { rankChunksForText } from "../rank";
import { buildEvidencePrompt, parseEvidenceOutput } from "../prompt";

describe("rankChunksForText", () => {
  const chunk = (doc: string, content: string): RetrievedChunk => ({ document_id: doc, document_title: `Doc ${doc}`, content });

  it("prefers chunks that share words and especially figures with the edited text", () => {
    const rows = [
      chunk("a", "Attendance rates in remote schools are lower than in cities."),
      chunk("b", "The eSafety survey found 53% of children aged 10-17 had experienced cyberbullying."),
      chunk("a", "Completely unrelated paragraph about funding models."),
    ];
    const out = rankChunksForText(rows, "Cyberbullying affects 53% of children, according to eSafety");
    expect(out[0].document_id).toBe("b");
    expect(out.flatMap((d) => d.chunks).every((c) => !c.content.includes("funding"))).toBe(true);
  });

  it("returns nothing when no chunk overlaps, and respects the per-document cap", () => {
    expect(rankChunksForText([chunk("a", "zzz yyy")], "Cyberbullying statistics")).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => chunk("a", `cyberbullying result number ${i}`));
    expect(rankChunksForText(many, "cyberbullying result", { perDoc: 3 })[0].chunks).toHaveLength(3);
  });

  it("matches figures written with thousands separators", () => {
    const out = rankChunksForText([chunk("a", "Over 1,200 schools took part in the programme.")], "1200 schools took part");
    expect(out).toHaveLength(1);
  });
});

describe("evidence-only prompt and parser", () => {
  it("includes the staff text and the numbered documents", () => {
    const prompt = buildEvidencePrompt({
      entityType: "state_issue",
      subject: "Bullying in Victoria",
      fields: [{ field: "stat", label: "Headline stat", text: "1 in 4 students" }],
      docs: [{ n: 1, title: "Report", chunks: [{ page: 3, heading: "Results", content: "One in four students." }] }],
    });
    expect(prompt).toContain("1 in 4 students");
    expect(prompt).toContain('<document n="1" title="Report"');
    expect(prompt).toContain("WORD FOR WORD");
  });

  it("parses evidence leniently and rejects unreadable replies", () => {
    const raw = JSON.stringify({ evidence: { stat: [{ source: 1, quote: "One in four students." }, { source: 9, quote: "bad source" }] } });
    expect(parseEvidenceOutput(raw, "state_issue", 2)).toEqual({ stat: [{ source: 1, quote: "One in four students." }] });
    expect(parseEvidenceOutput("{}", "state_issue", 2)).toEqual({});
    expect(() => parseEvidenceOutput("not json", "state_issue", 2)).toThrow(/unreadable/);
  });
});

import { mergeSources, type NumberedSource, type VaultSourceRow } from "../mergeSources";

describe("mergeSources", () => {
  const numbered: NumberedSource[] = [
    { id: "n1", num: 1, title: "eSafety Commissioner - Cyberbullying", url: null, publisher: "eSafety Commissioner", year: null },
    { id: "n2", num: 2, title: "AIHW Youth report", url: "https://www.aihw.gov.au/reports/youth/", publisher: "AIHW", year: 2024 },
  ];
  const vault = (rows: Partial<VaultSourceRow>[]): VaultSourceRow[] =>
    rows.map((r, i) => ({ document_id: `d${i}`, title: "Untitled", ...r }));

  it("lists a document that is in both lists once, keeping the numbered entry and filling in its missing link", () => {
    const out = mergeSources(
      numbered,
      vault([{ title: "eSafety Commissioner - Cyberbullying", source_url: "https://www.esafety.gov.au/key-topics/cyberbullying" }]),
    );
    expect(out.extras).toEqual([]);
    expect(out.numbered[0]).toMatchObject({ num: 1, url: "https://www.esafety.gov.au/key-topics/cyberbullying" });
  });

  it("appends vault documents that are new, in order, and never renumbers the references", () => {
    const out = mergeSources(
      numbered,
      vault([
        { title: "eSafety Commissioner - Cyberbullying" },
        { title: "eSafety Commissioner - Digital lives of Aussie teens", source_url: "https://www.esafety.gov.au/digital-lives" },
      ]),
    );
    expect(out.numbered.map((n) => n.num)).toEqual([1, 2]);
    expect(out.extras).toEqual([
      { id: "d1", label: "eSafety Commissioner - Digital lives of Aussie teens", url: "https://www.esafety.gov.au/digital-lives" },
    ]);
  });

  it("matches the same link despite www, trailing slash, query and case", () => {
    const out = mergeSources(numbered, vault([{ title: "Totally different title", source_url: "https://aihw.gov.au/Reports/Youth?x=1" }]));
    expect(out.extras).toEqual([]);
  });

  it("matches a composed reference that contains the numbered title", () => {
    const out = mergeSources(
      numbered,
      vault([{ title: "AIHW Youth report", author: "AIHW", year: "2024", publisher: "AIHW", source_url: null }]),
    );
    expect(out.extras).toEqual([]);
  });

  it("de-duplicates a document that appears for several pages, and ignores unsafe links", () => {
    const out = mergeSources(
      [],
      [
        { document_id: "d1", title: "Survey A", source_url: "javascript:alert(1)" },
        { document_id: "d1", title: "Survey A", source_url: null },
        { document_id: "d2", title: "Survey A", source_url: "https://x.org/a" },
      ],
    );
    expect(out.extras).toHaveLength(1);
    expect(out.extras[0]).toMatchObject({ id: "d1", url: "https://x.org/a" });
  });

  it("does not treat short titles as the same document", () => {
    const out = mergeSources([{ id: "n", num: 1, title: "Report", url: null }], vault([{ title: "Annual Report" }]));
    expect(out.extras).toHaveLength(1);
  });
});

import { interleave } from "../group";
import { figureCount } from "../rank";
import { buildUserPrompt } from "../prompt";

describe("interleave", () => {
  it("alternates between lists, best first, dropping repeats", () => {
    const a = ["a1", "a2", "a3"];
    const b = ["b1", "a2", "b3", "b4"];
    expect(interleave([a, b], (x) => x)).toEqual(["a1", "b1", "a2", "a3", "b3", "b4"]);
  });

  it("handles empty lists", () => {
    expect(interleave([], (x: string) => x)).toEqual([]);
    expect(interleave([[], ["x"]], (x) => x)).toEqual(["x"]);
  });
});

describe("a second document is not crowded out", () => {
  it("keeps passages from other documents when one document has many strong passages", () => {
    const strong: RetrievedChunk[] = Array.from({ length: 20 }, (_, i) => ({
      document_id: "dominant",
      document_title: "Dominant report",
      content: `Cyberbullying passage ${i} about definitions and policy.`,
    }));
    const other: RetrievedChunk[] = [
      { document_id: "stats", document_title: "Digital lives of Aussie teens", content: "53% of teens experienced cyberbullying in 2025." },
    ];
    // A large pool lists the other document's passage further down; grouping still includes it.
    const out = groupChunks([...strong, ...other]);
    expect(out.map((d) => d.document_id)).toContain("stats");
    expect(out.find((d) => d.document_id === "dominant")?.chunks).toHaveLength(4);
  });
});

describe("rankChunksForText with preferStats", () => {
  const chunk = (content: string): RetrievedChunk => ({ document_id: "a", document_title: "Doc", content });
  const rows = [
    chunk("Introduction: cyberbullying is a growing concern for schools and families across the country."),
    chunk("Cyberbullying results: 53% of teens, 38% in the past year, and 1,200 schools reported incidents in 2025."),
  ];

  it("puts the passage with figures first", () => {
    const out = rankChunksForText(rows, "cyberbullying schools", { preferStats: true });
    expect(out[0].chunks[0].content).toContain("53%");
  });

  it("does not boost unrelated passages that merely contain numbers", () => {
    const out = rankChunksForText(
      [chunk("Funding totals 12,500,000 across 340 programs and 25% of budgets."), chunk("Cyberbullying affects many students.")],
      "cyberbullying",
      { preferStats: true },
    );
    expect(out[0].chunks).toHaveLength(1);
    expect(out[0].chunks[0].content).toContain("Cyberbullying");
  });

  it("counts percentages and larger numbers", () => {
    expect(figureCount("53% and 38 %, 1,200 schools, 7 children")).toBe(3);
  });
});

describe("prompt when the reviewer chose the sources", () => {
  const base = {
    entityType: "issue" as const,
    subject: "Cyberbullying",
    current: { short_desc: "S", definition: "D", australian_data: "A", mechanisms: "M", anchor_stat: "x" },
    docs: [{ n: 1, title: "Survey", chunks: [{ content: "53% of teens." }] }],
  };

  it("tells the AI to use the chosen documents' figures", () => {
    expect(buildUserPrompt({ ...base, reviewerChoseSources: true })).toContain("The reviewer chose these documents specifically");
  });

  it("keeps the cautious wording for documents found by the automatic search", () => {
    expect(buildUserPrompt(base)).not.toContain("The reviewer chose these documents specifically");
  });
});

import { modelContentSchemas } from "../entities";
import { fieldText } from "../evidence";

describe("issue pages: impact areas and groups at risk", () => {
  const issue = {
    short_desc: "s", definition: "d", australian_data: "a", mechanisms: "m", anchor_stat: "x",
    impacts: [
      { title: "Sleep & Fatigue", text: "Night-time checking disrupts sleep." },
      { title: "School Avoidance", text: "Classmates involved, so school feels unsafe." },
    ],
    groups: ["Girls aged 10-17 (higher prevalence)", "LGBTQ+ youth (higher severity)"],
  };

  it("are part of the issue page's refreshable fields", () => {
    expect(FIELDS.issue).toContain("impacts");
    expect(FIELDS.issue).toContain("groups");
    expect(FIELD_LABELS.impacts).toBe("Key impact areas");
    expect(FIELD_LABELS.groups).toBe("Groups most at risk");
  });

  it("accept a valid draft and a partial publish of just one list", () => {
    expect(modelContentSchemas.issue.safeParse(issue).success).toBe(true);
    expect(publishContentSchemas.issue.safeParse({ groups: issue.groups }).success).toBe(true);
    expect(publishContentSchemas.issue.safeParse({ impacts: issue.impacts }).success).toBe(true);
  });

  it("reject duplicate titles/groups (they are React keys on the page), empty items and runaway lists", () => {
    const dupTitle = { ...issue, impacts: [issue.impacts[0], { ...issue.impacts[1], title: "sleep & fatigue" }] };
    expect(modelContentSchemas.issue.safeParse(dupTitle).success).toBe(false);
    expect(publishContentSchemas.issue.safeParse({ groups: ["A group", "a GROUP"] }).success).toBe(false);
    expect(publishContentSchemas.issue.safeParse({ groups: ["ok", ""] }).success).toBe(false);
    expect(publishContentSchemas.issue.safeParse({ impacts: [] }).success).toBe(false);
    expect(publishContentSchemas.issue.safeParse({ groups: Array.from({ length: 11 }, (_, i) => `g${i}`) }).success).toBe(false);
  });

  it("tell the AI to keep the page's current number of impact areas and groups", () => {
    const current = {
      ...issue,
      impacts: Array.from({ length: 4 }, (_, i) => ({ title: `T${i}`, text: "x" })),
      groups: Array.from({ length: 5 }, (_, i) => `g${i}`),
    };
    const prompt = buildUserPrompt({ entityType: "issue", subject: "Cyberbullying", current, docs: [] });
    expect(prompt).toContain("Return exactly 4 impact areas");
    expect(prompt).toContain("Return exactly 5 groups");
    expect(prompt).toContain("Key Impact Areas");
    expect(prompt).toContain("Groups Most at Risk");
  });

  it("notice a change in either list, and read their text for the figure checks", () => {
    const next = { ...issue, groups: [...issue.groups.slice(0, 1), "Students on image-based platforms"] };
    expect(changedFields("issue", issue, next)).toEqual(["groups"]);
    expect(changedFields("issue", issue, { ...issue, impacts: [issue.impacts[0], { ...issue.impacts[1], text: "New sentence about 40% of teens." }] })).toEqual(["impacts"]);
    expect(fieldText(issue.impacts)).toContain("Sleep & Fatigue");
    expect(fieldText(issue.groups)).toContain("LGBTQ+ youth");
  });
});

import { isBacked, mergeRefill, weakFields } from "../refillMerge";
import { buildRefillPrompt, parseRefillOutput } from "../prompt";
import type { EvidenceItem } from "../evidence";

const ev = (verified = true): EvidenceItem => ({ sourceId: "d1", label: "Doc", url: null, page: null, heading: null, quote: "q", verified });

describe("which sections count as having a valid source", () => {
  it("needs at least one quote, all found, and no untraceable figures", () => {
    expect(isBacked([ev()], [])).toBe(true);
    expect(isBacked([ev(), ev()], undefined)).toBe(true);
    expect(isBacked([], [])).toBe(false);
    expect(isBacked(undefined, undefined)).toBe(false);
    expect(isBacked([ev(), ev(false)], [])).toBe(false);
    expect(isBacked([ev()], ["53%"])).toBe(false);
  });

  it("treats unchanged sections and unbacked changes as weak, and backed changes as fine", () => {
    const fields = ["a", "b", "c", "d"];
    const weak = weakFields(fields, ["a", "b", "c"], { a: [ev()], b: [], c: [ev(false)] }, {});
    expect(weak).toEqual(["b", "c", "d"]); // a is backed; b/c changed without valid evidence; d unchanged
  });
});

describe("mergeRefill: what is kept for each weak section", () => {
  const base = {
    fields: ["a", "b", "c", "d"],
    current: { a: "A0", b: "B0", c: "C0", d: "D0" },
    draft: { a: "A1", b: "B1", c: "C1", d: "D0" }, // a backed; b,c changed but unbacked; d unchanged
    evidence: { a: [ev()], b: [], c: [] } as Record<string, EvidenceItem[]>,
    unsupported: {} as Record<string, string[]>,
    weak: ["b", "c", "d"],
  };

  it("uses the second pass where it is backed, keeps a flagged draft where it is not, and leaves unchanged sections alone", () => {
    const out = mergeRefill({
      ...base,
      refilled: { b: "B2", c: "C2", d: "D0" }, // b backed; c refilled but not backed; d unchanged (nothing relevant)
      refilledEvidence: { b: [ev()], c: [] },
      refilledUnsupported: {},
    });
    expect(out.content).toEqual({ a: "A1", b: "B2", c: "C1", d: "D0" });
    expect(out.nowBacked).toEqual(["b"]);
    expect(out.stillWeak).toEqual(["c"]);
    expect(out.keptCurrent).toEqual(["d"]);
    expect(out.evidence.b).toHaveLength(1);
    expect(out.evidence.a).toHaveLength(1); // an already-backed section is never touched
  });

  it("does not let an unchanged section gain unsupported text", () => {
    const out = mergeRefill({
      ...base,
      weak: ["d"],
      refilled: { d: "D-new with 99% of teens" },
      refilledEvidence: { d: [] },
      refilledUnsupported: { d: ["99%"] },
    });
    expect(out.content.d).toBe("D0");
    expect(out.keptCurrent).toEqual(["d"]);
  });

  it("rejects a refilled section whose figures are not in the documents", () => {
    const out = mergeRefill({
      ...base,
      weak: ["b"],
      refilled: { b: "B2" },
      refilledEvidence: { b: [ev()] },
      refilledUnsupported: { b: ["77%"] },
    });
    expect(out.content.b).toBe("B1"); // keeps the first draft, flagged
    expect(out.stillWeak).toEqual(["b"]);
  });

  it("survives a second pass that returned nothing", () => {
    const out = mergeRefill({ ...base, refilled: {}, refilledEvidence: {}, refilledUnsupported: {} });
    expect(out.content).toEqual({ a: "A1", b: "B1", c: "C1", d: "D0" });
    expect(out.stillWeak).toEqual(["b", "c"]);
    expect(out.keptCurrent).toEqual(["d"]);
  });
});

describe("second-pass prompt and parser", () => {
  const ctx = {
    entityType: "issue" as const,
    subject: "Cyberbullying",
    current: {
      short_desc: "S", definition: "Old definition", australian_data: "A", mechanisms: "M", anchor_stat: "x",
      impacts: Array.from({ length: 4 }, (_, i) => ({ title: `T${i}`, text: "t" })),
      groups: Array.from({ length: 5 }, (_, i) => `g${i}`),
    },
    draft: {},
    fields: ["definition", "groups"],
    docs: [{ n: 1, title: "Survey", chunks: [{ content: "53% of teens." }] }],
  };

  it("asks only for the weak sections, using the documents", () => {
    const prompt = buildRefillPrompt(ctx);
    expect(prompt).toContain("NOT yet backed by any quote");
    expect(prompt).toContain("definition (Definition)");
    expect(prompt).toContain("groups (Groups most at risk)");
    expect(prompt).not.toContain("short_desc (Short description)");
    expect(prompt).toContain('<document n="1" title="Survey"');
    expect(prompt).toContain("Return exactly 5 groups");
  });

  it("keeps valid sections and drops invalid or missing ones", () => {
    const raw = JSON.stringify({
      content: { definition: "New definition citing 53% (Source: Survey).", groups: [] /* invalid: min 1 */, mechanisms: "ignored: not requested" },
      evidence: { definition: [{ source: 1, quote: "53% of teens." }] },
    });
    const out = parseRefillOutput(raw, "issue", ["definition", "groups"], 1);
    expect(out.content).toEqual({ definition: "New definition citing 53% (Source: Survey)." });
    expect(out.evidence).toEqual({ definition: [{ source: 1, quote: "53% of teens." }] });
    expect(() => parseRefillOutput("nope", "issue", ["definition"], 1)).toThrow(/unreadable/);
  });
});
