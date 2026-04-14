/**
 * Data Integrity Tests
 *
 * These tests query the production Supabase database directly and assert
 * known facts about the data. They run in CI on every push to main.
 *
 * ⚠️  Requires env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * If vars are missing the suite is skipped (allows local runs without secrets).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

interface IssueRow   { id: string; slug: string; title: string }
interface StateRow   { slug: string; name: string; issues: { name: string; slug?: string }[] }
interface SchoolStats {
  total_schools:  number;
  total_enrolments: number;
  avg_icsea: number | null;
  sector_counts: Record<string, number> | null;
  geo_counts:    Record<string, number> | null;
}

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const skip = !url || !key;

describe.skipIf(skip)("Data integrity — issues table", () => {
  let sb: AnyClient;

  beforeAll(() => { sb = createClient(url!, key!); });

  it("has at least 15 global issues", async () => {
    const { count, error } = await sb
      .from("issues")
      .select("*", { count: "exact", head: true });
    expect(error).toBeNull();
    expect(count).toBeGreaterThanOrEqual(15);
  });

  it("every issue has a non-empty slug", async () => {
    const { data, error } = await sb.from("issues").select("id, slug, title");
    expect(error).toBeNull();
    const rows = (data ?? []) as IssueRow[];
    const missing = rows.filter((r) => !r.slug || r.slug.trim() === "");
    expect(missing, `Issues without slug: ${missing.map((r) => r.title).join(", ")}`).toHaveLength(0);
  });

  it("every issue has a non-empty title", async () => {
    const { data, error } = await sb.from("issues").select("id, title");
    expect(error).toBeNull();
    const rows = (data ?? []) as IssueRow[];
    const missing = rows.filter((r) => !r.title || r.title.trim() === "");
    expect(missing).toHaveLength(0);
  });

  it("known slugs exist: anxiety-depression, bullying, self-harm-suicidality", async () => {
    const slugs = ["anxiety-depression", "bullying", "self-harm-suicidality"];
    for (const slug of slugs) {
      const { data } = await sb.from("issues").select("slug").eq("slug", slug).single();
      const row = data as { slug: string } | null;
      expect(row?.slug, `Missing issue slug: ${slug}`).toBe(slug);
    }
  });
});

describe.skipIf(skip)("Data integrity — states table", () => {
  let sb: AnyClient;

  beforeAll(() => { sb = createClient(url!, key!); });

  it("has exactly 8 states", async () => {
    const { count, error } = await sb
      .from("states")
      .select("*", { count: "exact", head: true });
    expect(error).toBeNull();
    expect(count).toBe(8);
  });

  it("every state has at least 1 issue entry", async () => {
    const { data, error } = await sb.from("states").select("slug, name, issues");
    expect(error).toBeNull();
    const rows = (data ?? []) as StateRow[];
    const empty = rows.filter((s) => !s.issues || s.issues.length === 0);
    expect(empty, `States with no issues: ${empty.map((s) => s.name).join(", ")}`).toHaveLength(0);
  });

  it("every state issue entry has a slug (issue link)", async () => {
    const { data, error } = await sb.from("states").select("slug, name, issues");
    expect(error).toBeNull();
    const rows = (data ?? []) as StateRow[];
    const missing: string[] = [];
    for (const state of rows) {
      const noSlug = state.issues.filter((i) => !i.slug || i.slug.trim() === "");
      if (noSlug.length > 0) {
        missing.push(`${state.name}: [${noSlug.map((i) => i.name).join(", ")}]`);
      }
    }
    expect(missing, `State issues without slug:\n${missing.join("\n")}`).toHaveLength(0);
  });

  it("western-australia state exists", async () => {
    const { data, error } = await sb.from("states").select("slug").eq("slug", "western-australia").single();
    expect(error).toBeNull();
    const row = data as { slug: string } | null;
    expect(row?.slug).toBe("western-australia");
  });
});

describe.skipIf(skip)("Data integrity — school stats RPC", () => {
  let sb: AnyClient;

  beforeAll(() => { sb = createClient(url!, key!); });

  const STATE_MINIMUMS: Record<string, number> = {
    VIC: 1500,
    NSW: 2000,
    QLD: 1200,
    WA:  800,
    SA:  500,
    TAS: 200,
    ACT: 80,
    NT:  100,
  };

  for (const [code, min] of Object.entries(STATE_MINIMUMS)) {
    it(`get_school_stats_for_state(${code}) returns total_schools >= ${min}`, async () => {
      const { data, error } = await (sb.rpc as Function)("get_school_stats_for_state", { p_state_code: code });
      expect(error, `RPC error for ${code}: ${String(error?.message)}`).toBeNull();
      expect(data).toBeTruthy();
      const stats = data as SchoolStats;
      expect(
        stats.total_schools,
        `${code} has ${stats.total_schools} schools — expected >= ${min}. PostgREST row cap may have re-appeared.`
      ).toBeGreaterThanOrEqual(min);
    });
  }

  it("VIC sector counts: Government >= 1500, Catholic >= 400, Independent >= 200", async () => {
    const { data, error } = await (sb.rpc as Function)("get_school_stats_for_state", { p_state_code: "VIC" });
    expect(error).toBeNull();
    const stats = data as SchoolStats;
    expect(stats.sector_counts?.Government).toBeGreaterThanOrEqual(1500);
    expect(stats.sector_counts?.Catholic).toBeGreaterThanOrEqual(400);
    expect(stats.sector_counts?.Independent).toBeGreaterThanOrEqual(200);
  });

  it("all states have non-null geo_counts", async () => {
    for (const code of Object.keys(STATE_MINIMUMS)) {
      const { data } = await (sb.rpc as Function)("get_school_stats_for_state", { p_state_code: code });
      const stats = data as SchoolStats;
      expect(stats?.geo_counts, `${code} has null geo_counts`).not.toBeNull();
    }
  });
});
