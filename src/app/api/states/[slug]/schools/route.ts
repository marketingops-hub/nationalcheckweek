import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

interface SchoolRow {
  school_sector:              string | null;
  school_type:                string | null;
  geolocation:                string | null;
  icsea:                      number | null;
  total_enrolments:           number | null;
  indigenous_enrolments_pct:  number | null;
  lbote_yes_pct:              number | null;
  bottom_sea_quarter_pct:     number | null;
}

const STATE_CODES: Record<string, string> = {
  victoria:                    "VIC",
  "new-south-wales":           "NSW",
  queensland:                  "QLD",
  "western-australia":         "WA",
  "south-australia":           "SA",
  tasmania:                    "TAS",
  "australian-capital-territory": "ACT",
  "northern-territory":        "NT",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const stateCode = STATE_CODES[slug];
  if (!stateCode) {
    return NextResponse.json({ error: "Unknown state slug" }, { status: 404 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: raw, error } = await sb
    .from("school_profiles")
    .select(
      "school_sector, school_type, geolocation, icsea, " +
      "total_enrolments, indigenous_enrolments_pct, lbote_yes_pct, " +
      "bottom_sea_quarter_pct"
    )
    .eq("state", stateCode);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const data = (raw ?? []) as unknown as SchoolRow[];

  if (data.length === 0) {
    return NextResponse.json({ empty: true }, { status: 200 });
  }

  const total_schools = data.length;

  // Total enrolments
  const total_enrolments = data.reduce(
    (s, r) => s + (r.total_enrolments ?? 0), 0
  );

  // Avg ICSEA (only rows that have a value)
  const icseaRows = data.filter((r) => r.icsea != null);
  const avg_icsea =
    icseaRows.length > 0
      ? Math.round(icseaRows.reduce((s, r) => s + r.icsea!, 0) / icseaRows.length)
      : null;

  // Sector breakdown
  const sectors: Record<string, number> = {};
  for (const r of data) {
    const k = r.school_sector ?? "Unknown";
    sectors[k] = (sectors[k] ?? 0) + 1;
  }

  // Type breakdown
  const types: Record<string, number> = {};
  for (const r of data) {
    const k = r.school_type ?? "Unknown";
    types[k] = (types[k] ?? 0) + 1;
  }

  // Geolocation breakdown
  const geolocation: Record<string, number> = {};
  for (const r of data) {
    const k = r.geolocation ?? "Unknown";
    geolocation[k] = (geolocation[k] ?? 0) + 1;
  }

  // Equity averages — weighted by schools that have data
  function avgPct(field: keyof typeof data[0]) {
    const valid = data.filter((r) => r[field] != null);
    if (valid.length === 0) return null;
    const sum = valid.reduce((s, r) => s + (r[field] as number), 0);
    return Math.round((sum / valid.length) * 10) / 10;
  }

  const indigenous_avg_pct   = avgPct("indigenous_enrolments_pct");
  const lbote_avg_pct        = avgPct("lbote_yes_pct");
  const bottom_quarter_avg_pct = avgPct("bottom_sea_quarter_pct");

  return NextResponse.json(
    {
      state_code: stateCode,
      total_schools,
      total_enrolments,
      avg_icsea,
      sectors,
      types,
      geolocation,
      indigenous_avg_pct,
      lbote_avg_pct,
      bottom_quarter_avg_pct,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    }
  );
}
