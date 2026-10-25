// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/adminFetch", () => ({ adminFetch: vi.fn() }));

import { adminFetch } from "@/lib/adminFetch";
import RefreshFromVault from "../RefreshFromVault";

const SOURCE = { id: "doc1", title: "Report", label: "AIHW (2025). Report", url: "https://x.org/r", year: "2025", cited: true };

const IMPACTS = [
  { title: "Sleep & Fatigue", text: "Night-time checking disrupts sleep." },
  { title: "School Avoidance", text: "Classmates involved, so school feels unsafe." },
];
const GROUPS = ["Girls aged 10-17", "LGBTQ+ youth"];

const PREVIEW = {
  subject: "Cyberbullying (national issue page)",
  current: { short_desc: "S", definition: "D", australian_data: "A", mechanisms: "M", anchor_stat: "Old stat", impacts: IMPACTS, groups: GROUPS },
  proposed: { short_desc: "S", definition: "D", australian_data: "A", mechanisms: "M", anchor_stat: "53% of children", impacts: IMPACTS, groups: GROUPS },
  changed: ["anchor_stat"],
  sources: [SOURCE],
  evidence: {
    anchor_stat: [
      { sourceId: "doc1", label: SOURCE.label, url: SOURCE.url, page: 14, heading: "Results", quote: "53% of children had experienced it", verified: true },
    ],
  },
  unsupported: {},
  warnings: [],
};

const FOUND = { id: "doc2", title: "Survey", label: "eSafety (2024). Survey", url: null, year: "2024", cited: false, snippets: ["Some excerpt text"] };

type Call = { url: string; body?: Record<string, unknown> };
let calls: Call[] = [];

function respond(data: unknown) {
  return Promise.resolve({ ok: true, json: async () => data } as Response);
}

beforeEach(() => {
  calls = [];
  vi.mocked(adminFetch).mockImplementation(async (url: string, opts?: RequestInit) => {
    const body = opts?.body ? (JSON.parse(String(opts.body)) as Record<string, unknown>) : undefined;
    calls.push({ url, body });
    if (url.includes("/versions")) return respond({ versions: [] });
    if (url.includes("/search")) return respond({ results: [FOUND] });
    if (url.includes("/verify")) {
      return respond({ changed: ["anchor_stat"], evidence: PREVIEW.evidence, unsupported: {}, warnings: [], checkedSourceIds: body?.source_ids });
    }
    if (url.includes("/preview")) {
      const ids = body?.source_ids as string[] | undefined;
      return respond(ids ? { ...PREVIEW, sources: [SOURCE, { ...FOUND, cited: true }] } : PREVIEW);
    }
    return respond({});
  });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function open() {
  render(<RefreshFromVault entityType="issue" entityKey="cyberbullying" pagePath="/issues/cyberbullying" />);
}

async function startReview() {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Refresh from vault" }));
  await screen.findByText(/Review: Cyberbullying/);
}

describe("RefreshFromVault review flow", () => {
  it("shows one status, the changed field with its evidence, and collapses unchanged fields", async () => {
    await startReview();

    expect(screen.getByText(/Checked against 1 source/)).toBeTruthy();
    expect(screen.getByRole("tab", { name: /1\. Changes \(1\)/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /2\. Sources \(1 ticked\)/ })).toBeTruthy();

    // changed field: before/after, and the quote with its location
    expect(screen.getByText("Live now")).toBeTruthy();
    expect(screen.getByText("New version")).toBeTruthy();
    expect(screen.getByText("Old stat")).toBeTruthy();
    expect(screen.getByText("53% of children")).toBeTruthy();
    expect(screen.getByText(/53% of children had experienced it/)).toBeTruthy();
    expect(screen.getByText("✓ Backed by sources")).toBeTruthy();

    // the six unchanged fields (including impact areas and groups) are one-line rows, not cards
    expect(screen.getAllByText(/· no change/)).toHaveLength(6);

    expect(screen.getByText("1 change")).toBeTruthy(); // the publish summary
    expect(screen.getByRole("button", { name: "Publish 1 change" })).toBeTruthy();
  });

  it("editing the text asks to re-check, and re-checking sends the edited wording", async () => {
    await startReview();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("anchor_stat"), { target: { value: "Over half of children" } });

    expect(screen.getByText(/You edited the text/)).toBeTruthy();
    expect(screen.getByText("Not checked yet")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Re-check my edits" }));
    await screen.findByText(/Checked against 1 source/);

    const verify = calls.find((c) => c.url.includes("/verify"));
    expect(verify?.body).toMatchObject({
      entity_type: "issue",
      entity_key: "cyberbullying",
      source_ids: ["doc1"],
      proposed: { anchor_stat: "Over half of children" },
    });
  });

  it("adding a source asks to regenerate, and regenerating writes the draft from the ticked sources", async () => {
    await startReview();

    fireEvent.click(screen.getByRole("tab", { name: /2\. Sources/ }));
    fireEvent.change(screen.getByLabelText("Search the vault"), { target: { value: "cyberbullying survey" } });
    fireEvent.click(screen.getByRole("button", { name: "Search vault" }));
    await screen.findByText("eSafety (2024). Survey");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText(/You changed the sources/)).toBeTruthy();
    expect(screen.getByRole("tab", { name: /2\. Sources \(2 ticked\)/ })).toBeTruthy();
    expect(screen.getByText("added by you")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Regenerate draft" }));
    await waitFor(() => expect(screen.queryByText(/You changed the sources/)).toBeNull());

    const regen = calls.filter((c) => c.url.includes("/preview")).at(-1);
    expect(regen?.body?.source_ids).toEqual(["doc1", "doc2"]);
    expect(screen.getByText(/Checked against 2 sources/)).toBeTruthy();
  });

  it("a source without a public link says so and offers to add one", async () => {
    await startReview();
    fireEvent.click(screen.getByRole("tab", { name: /2\. Sources/ }));
    fireEvent.change(screen.getByLabelText("Search the vault"), { target: { value: "survey data" } });
    fireEvent.click(screen.getByRole("button", { name: "Search vault" }));
    await screen.findByText("eSafety (2024). Survey");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText(/1 ticked document has no public link/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add link" })).toBeTruthy();
  });
});

describe("RefreshFromVault: impact areas and groups at risk", () => {
  it("shows a changed list next to the live one, with its evidence, and lets staff edit it", async () => {
    const newImpacts = [IMPACTS[0], { title: "Anxiety", text: "Constant monitoring raises anxiety." }];
    vi.mocked(adminFetch).mockImplementation(async (url: string, opts?: RequestInit) => {
      const body = opts?.body ? (JSON.parse(String(opts.body)) as Record<string, unknown>) : undefined;
      calls.push({ url, body });
      if (url.includes("/versions")) return respond({ versions: [] });
      if (url.includes("/preview")) {
        return respond({
          ...PREVIEW,
          proposed: { ...PREVIEW.proposed, anchor_stat: "Old stat", impacts: newImpacts },
          changed: ["impacts"],
          evidence: { impacts: [{ sourceId: "doc1", label: SOURCE.label, url: SOURCE.url, page: 3, heading: "Effects", quote: "Constant monitoring raises anxiety among teens.", verified: true }] },
        });
      }
      return respond({});
    });

    await startReview();

    expect(screen.getByText("Key impact areas")).toBeTruthy();
    expect(screen.getByText("School Avoidance")).toBeTruthy(); // live now
    expect(screen.getByText("Anxiety")).toBeTruthy(); // new version
    expect(screen.getByText(/Constant monitoring raises anxiety among teens/)).toBeTruthy();
    expect(screen.getByText("Groups most at risk")).toBeTruthy(); // collapsed: unchanged

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Impact area 2 title"), { target: { value: "Low mood" } });
    expect(screen.getByText(/You edited the text/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publish 1 change" })).toBeTruthy();
  });
});
