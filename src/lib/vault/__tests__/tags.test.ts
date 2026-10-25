import { describe, expect, it } from "vitest";
import { DEFAULT_UPLOAD_CATEGORY, UPLOAD_CATEGORIES } from "../categories";
import { MAX_TAGS, addTags, cleanTag, countTags, suggest } from "../tags";

describe("upload categories", () => {
  it("offers NCIW and General, with NCIW preselected", () => {
    expect(UPLOAD_CATEGORIES.map((c) => c.value)).toEqual(["nciw", "general"]);
    expect(DEFAULT_UPLOAD_CATEGORY).toBe("nciw");
  });
});

describe("cleanTag", () => {
  it("trims, collapses spaces, drops commas and caps the length", () => {
    expect(cleanTag("  mental   health, ")).toBe("mental health");
    expect(cleanTag("x".repeat(80))).toHaveLength(50);
  });
});

describe("addTags", () => {
  const known = ["Mental Health", "AIHW", "research"];

  it("adds free-text tags", () => {
    expect(addTags([], "brand new")).toEqual(["brand new"]);
  });

  it("reuses the spelling of an existing tag, ignoring case", () => {
    expect(addTags([], "mental health", known)).toEqual(["Mental Health"]);
    expect(addTags([], "aihw", known)).toEqual(["AIHW"]);
  });

  it("splits pasted comma-separated lists and skips duplicates and blanks", () => {
    expect(addTags(["research"], "Research, aihw, , new", known)).toEqual(["research", "AIHW", "new"]);
  });

  it("returns the same array when nothing is added", () => {
    const current = ["research"];
    expect(addTags(current, "RESEARCH", known)).toBe(current);
    expect(addTags(current, "  ,  ", known)).toBe(current);
  });

  it("never exceeds the maximum number of tags", () => {
    const many = Array.from({ length: MAX_TAGS }, (_, i) => `t${i}`);
    expect(addTags(many, "one more")).toBe(many);
    expect(addTags(many.slice(0, MAX_TAGS - 1), "a, b, c")).toHaveLength(MAX_TAGS);
  });
});

describe("suggest", () => {
  const known = [
    { tag: "statistics", count: 9 },
    { tag: "mental health", count: 7 },
    { tag: "AIHW", count: 5 },
    { tag: "health policy", count: 2 },
  ];

  it("hides selected tags and ranks prefix matches first", () => {
    expect(suggest(known, ["AIHW"], "").map((k) => k.tag)).toEqual(["statistics", "mental health", "health policy"]);
    expect(suggest(known, [], "health").map((k) => k.tag)).toEqual(["health policy", "mental health"]);
  });

  it("returns nothing when nothing matches and respects the limit", () => {
    expect(suggest(known, [], "zzz")).toEqual([]);
    expect(suggest(known, [], "", 2)).toHaveLength(2);
  });
});

describe("countTags", () => {
  it("counts distinct tags ignoring case, most used first", () => {
    const out = countTags([
      { tags: ["Research", "aihw"] },
      { tags: ["research", " "] },
      { tags: null },
      { tags: ["Brand"] },
    ]);
    expect(out).toEqual([
      { tag: "Research", count: 2 },
      { tag: "aihw", count: 1 },
      { tag: "Brand", count: 1 },
    ]);
  });
});
