// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/lib/pageRefresh/pageSources", () => ({ getPageSourceRows: vi.fn() }));

import { getPageSourceRows } from "@/lib/pageRefresh/pageSources";
import IssueSourcesSection from "@/components/IssueSourcesSection";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function show(props: Parameters<typeof IssueSourcesSection>[0]) {
  const ui = await IssueSourcesSection(props);
  return render(ui ?? <div data-testid="empty" />);
}

const NUMBERED = [
  { id: "n1", num: 1, title: "eSafety Commissioner - Cyberbullying", url: "https://www.esafety.gov.au/key-topics/cyberbullying", publisher: "eSafety Commissioner", year: null, verified: false },
];

describe("IssueSourcesSection", () => {
  it("shows the numbered references and the vault documents as ONE list, without the duplicate", async () => {
    vi.mocked(getPageSourceRows).mockResolvedValue([
      { document_id: "d1", title: "eSafety Commissioner - Cyberbullying", source_url: "https://www.esafety.gov.au/key-topics/cyberbullying" },
      { document_id: "d2", title: "eSafety Commissioner - Digital lives of Aussie teens", source_url: "https://www.esafety.gov.au/digital-lives" },
    ]);

    await show({ numbered: NUMBERED, legacy: [], vault: [{ entityType: "issue", entityKey: "cyberbullying" }] });

    // a single section with a single heading, and no separate "Latest data sources" block
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Sources & References" })).toBeTruthy();
    expect(screen.queryByText("Latest data sources")).toBeNull();

    // eSafety Cyberbullying once (numbered 1); the new document continues the numbering as 2
    expect(screen.getAllByText("eSafety Commissioner - Cyberbullying")).toHaveLength(1);
    const digital = screen.getByRole("link", { name: "eSafety Commissioner - Digital lives of Aussie teens" });
    expect(digital.getAttribute("href")).toBe("https://www.esafety.gov.au/digital-lives");
    expect(document.getElementById("source-1")).toBeTruthy();
    expect(document.getElementById("source-2")?.textContent).toContain("Digital lives of Aussie teens");
    expect(document.querySelectorAll(".source-item")).toHaveLength(2);
  });

  it("shows a vault document without a public link as plain text", async () => {
    vi.mocked(getPageSourceRows).mockResolvedValue([{ document_id: "d1", title: "Internal survey results", source_url: null }]);
    await show({ numbered: [], legacy: [], vault: [{ entityType: "issue", entityKey: "x" }] });
    expect(screen.getByText("Internal survey results")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Internal survey results" })).toBeNull();
    expect(document.getElementById("source-1")).toBeTruthy();
  });

  it("combines the sources of several pages (state figures and the national overview) into one section", async () => {
    vi.mocked(getPageSourceRows).mockImplementation(async (_type, key) =>
      key === "victoria/bullying"
        ? [{ document_id: "d1", title: "Victorian student survey", source_url: "https://vic.gov.au/survey" }]
        : [{ document_id: "d2", title: "National bullying review", source_url: "https://x.org/review" }],
    );
    await show({
      numbered: [],
      legacy: [],
      vault: [
        { entityType: "state_issue", entityKey: "victoria/bullying" },
        { entityType: "issue", entityKey: "bullying" },
      ],
    });
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(document.getElementById("source-1")?.textContent).toContain("Victorian student survey");
    expect(document.getElementById("source-2")?.textContent).toContain("National bullying review");
  });

  it("keeps the empty message on pages that show one, and hides the section on pages that don't", async () => {
    vi.mocked(getPageSourceRows).mockResolvedValue([]);
    const first = await show({ numbered: [], legacy: [], vault: [], emptyMessage: "Sources will be added as this content is verified." });
    expect(screen.getByText("Sources will be added as this content is verified.")).toBeTruthy();
    first.unmount();
    await show({ numbered: [], legacy: [], vault: [] });
    expect(screen.getByTestId("empty")).toBeTruthy();
  });

  it("falls back to the older plain-text sources only when there are no numbered references", async () => {
    vi.mocked(getPageSourceRows).mockResolvedValue([]);
    await show({ numbered: [], legacy: ["Mission Australia Youth Survey 2024"], vault: [] });
    expect(screen.getByText(/Mission Australia Youth Survey 2024/)).toBeTruthy();
  });
});
