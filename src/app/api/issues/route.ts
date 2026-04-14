import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/issues
 * Fetch all issues from the database
 */
export async function GET() {
  try {
    // Lazy initialize Supabase client to avoid build-time errors
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("rank", { ascending: true });

    if (error) {
      console.error("Supabase error fetching issues:", error);
      return NextResponse.json(
        { error: "Failed to fetch issues from database" },
        { status: 500 }
      );
    }

    // Transform snake_case DB columns to camelCase for frontend
    const issues = data.map((row) => ({
      rank: row.rank,
      slug: row.slug,
      icon: row.icon,
      severity: row.severity,
      title: row.title,
      anchorStat: row.anchor_stat,
      shortDesc: row.short_desc,
      definition: row.definition,
      australianData: row.australian_data,
      mechanisms: row.mechanisms,
      impacts: row.impacts,
      groups: row.groups,
      sources: row.sources,
    }));

    return NextResponse.json(issues);
  } catch (err) {
    console.error("Unexpected error in /api/issues:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
