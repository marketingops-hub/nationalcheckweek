import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const issueRow = {
    title: "Cyberbullying",
    short_desc: "Short",
    definition: "Old definition.",
    australian_data: "Old data.",
    mechanisms: "Old mechanisms.",
    anchor_stat: "Old stat",
    impacts: [{ title: "Sleep", text: "Disrupts sleep." }],
    groups: ["Girls aged 10-17", "LGBTQ+ youth"],
  };
  const docRows = [
    { id: "d1", title: "Digital lives of Aussie teens", reference: null, author: "eSafety", publisher: null, year: "2025", page_ref: null, source_url: "https://x.org/digital-lives" },
  ];
  const chain: Record<string, unknown> = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.in = () => Promise.resolve({ data: docRows, error: null });
  chain.maybeSingle = () => Promise.resolve({ data: issueRow, error: null });
  return { issueRow, docRows, db: { from: () => chain }, generate: vi.fn(), retrieveForPage: vi.fn(), fetchAllChunks: vi.fn() };
});

vi.mock("@/lib/adminClient", () => ({ adminClient: () => h.db }));
vi.mock("@/lib/ai/anthropic-service", () => ({ anthropicService: { generateContent: h.generate } }));
vi.mock("../retrieve", () => ({ retrieveForPage: h.retrieveForPage, retrieveChunks: vi.fn() }));
vi.mock("../chunks", () => ({ fetchAllChunks: h.fetchAllChunks }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { previewRefresh } from "../service";

const STAT_PASSAGE = "The eSafety survey found 53% of teens experienced cyberbullying in 2025.";
const chunk = (content: string) => ({ document_id: "d1", document_title: "Digital lives of Aussie teens", chunk_page: 7, chunk_heading: "Results", content });

// What the AI returns for the first draft: only the anchor stat changes, with a real quote.
const firstDraft = {
  content: {
    short_desc: h.issueRow.short_desc,
    definition: h.issueRow.definition,
    australian_data: h.issueRow.australian_data,
    mechanisms: h.issueRow.mechanisms,
    anchor_stat: "53% of teens",
    impacts: h.issueRow.impacts,
    groups: h.issueRow.groups,
  },
  sources_used: [1],
  evidence: { anchor_stat: [{ source: 1, quote: "found 53% of teens experienced cyberbullying in 2025" }] },
};

// The second pass: definition gets a real quote; groups gets an invented one.
const secondPass = {
  content: {
    definition: "Cyberbullying affected 53% of teens in 2025 (Source: Digital lives of Aussie teens).",
    groups: ["Young women aged 10-17 (62%)", "LGBTQ+ youth"],
  },
  evidence: {
    definition: [{ source: 1, quote: "53% of teens experienced cyberbullying in 2025" }],
    groups: [{ source: 1, quote: "Young women are 62% more likely to be targeted online" }],
  },
};

beforeEach(() => {
  h.generate.mockReset();
  h.retrieveForPage.mockResolvedValue([chunk(STAT_PASSAGE)]);
  h.fetchAllChunks.mockResolvedValue([chunk(STAT_PASSAGE), chunk("Unrelated paragraph about funding models.")]);
  h.generate.mockImplementation(async (_system: string, user: string) => ({
    content: JSON.stringify(user.includes("NOT yet backed") ? secondPass : firstDraft),
  }));
});

describe("previewRefresh: sections without a valid source are redone from the picked documents", () => {
  it("backs a weak section with a real quote, and does not give a section unsupported text", async () => {
    const out = await previewRefresh("issue", "cyberbullying");

    // two AI calls: the first draft, then the second pass for the sections without a source
    expect(h.generate).toHaveBeenCalledTimes(2);
    const secondPrompt = h.generate.mock.calls[1][1] as string;
    expect(secondPrompt).toContain("definition (Definition)");
    expect(secondPrompt).toContain("groups (Groups most at risk)");
    expect(secondPrompt).not.toContain("anchor_stat (Anchor stat)"); // already backed: not redone

    // anchor stat (first pass) and definition (second pass) are now changed and backed by verified quotes
    expect(out.changed.sort()).toEqual(["anchor_stat", "definition"]);
    expect(out.evidence.anchor_stat[0].verified).toBe(true);
    expect(out.evidence.definition[0]).toMatchObject({ verified: true, sourceId: "d1", page: 7, heading: "Results" });
    expect(out.proposed.definition).toContain("53% of teens in 2025");

    // groups: the invented quote is not in the documents, so the live text is left alone
    expect(out.proposed.groups).toEqual(h.issueRow.groups);
    expect(out.changed).not.toContain("groups");

    // the page-level note says what happened, in plain words
    const note = out.warnings.join(" ");
    expect(note).toMatch(/went back to your documents/);
    expect(note).toMatch(/now backed by a quote: Definition/);
    expect(note).toMatch(/left as they are/);
  });

  it("keeps the first draft when the second pass fails", async () => {
    h.generate.mockImplementation(async (_s: string, user: string) => {
      if (user.includes("NOT yet backed")) throw new Error("boom");
      return { content: JSON.stringify(firstDraft) };
    });
    const out = await previewRefresh("issue", "cyberbullying");
    expect(out.changed).toEqual(["anchor_stat"]);
    expect(out.evidence.anchor_stat[0].verified).toBe(true);
  });

  it("skips the second pass when every section is already backed", async () => {
    const allBacked = {
      content: {
        ...firstDraft.content,
        short_desc: "53% of teens experienced cyberbullying.",
        definition: "Definition citing 53% of teens experienced cyberbullying in 2025.",
        australian_data: "Data: 53% of teens experienced cyberbullying in 2025.",
        mechanisms: "Mechanisms: 53% of teens experienced cyberbullying in 2025.",
        impacts: [{ title: "Anxiety", text: "53% of teens experienced cyberbullying in 2025." }],
        groups: ["Teens (53% experienced cyberbullying in 2025)"],
      },
      sources_used: [1],
      evidence: Object.fromEntries(
        ["short_desc", "definition", "australian_data", "mechanisms", "anchor_stat", "impacts", "groups"].map((f) => [
          f,
          [{ source: 1, quote: "53% of teens experienced cyberbullying in 2025" }],
        ]),
      ),
    };
    h.generate.mockImplementation(async () => ({ content: JSON.stringify(allBacked) }));
    const out = await previewRefresh("issue", "cyberbullying");
    expect(h.generate).toHaveBeenCalledTimes(1);
    expect(out.changed).toHaveLength(7);
    expect(out.warnings.join(" ")).not.toMatch(/went back to your documents/);
  });
});
