import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/adminClient";

export const runtime = "nodejs";

/**
 * GET /api/admin/dashboard/stats
 * Aggregated dashboard statistics - single endpoint for all dashboard data
 * Cached for 60 seconds with stale-while-revalidate
 */
export async function GET(req: NextRequest) {
  // Authenticate via the session cookie.
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Authorize + fetch via the service-role client (bypasses RLS), the same
  // way the middleware and every other admin route resolve roles. Reading the
  // profile through the RLS-bound session client previously failed for staff
  // whose own row wasn't readable under policy, yielding a spurious 403.
  const sb = adminClient();
  const { data: profile } = await sb
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !["editor", "admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json(
      { error: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  try {
    // Execute all queries in parallel
    const [
      issuesCount,
      statesCount,
      areasCount,
      eventsCount,
      publishedEventsCount,
      seoMissingCount,
      schoolsCount,
      recentIssues,
      recentAreas,
      recentEvents,
    ] = await Promise.all([
      sb.from("issues").select("id", { count: "exact", head: true }),
      sb.from("states").select("id", { count: "exact", head: true }),
      sb.from("areas").select("id", { count: "exact", head: true }),
      sb.from("events").select("id", { count: "exact", head: true }),
      sb.from("events").select("id", { count: "exact", head: true }).eq("published", true),
      sb.from("areas").select("id", { count: "exact", head: true }).or("seo_title.is.null,seo_title.eq."),
      sb.from("school_profiles").select("id", { count: "exact", head: true }),
      sb.from("issues").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(3),
      sb.from("areas").select("id, name, state, updated_at").order("updated_at", { ascending: false }).limit(3),
      sb.from("events").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(3),
    ]);

    const stats = {
      counts: {
        issues: issuesCount.count ?? 0,
        states: statesCount.count ?? 0,
        areas: areasCount.count ?? 0,
        events: eventsCount.count ?? 0,
        publishedEvents: publishedEventsCount.count ?? 0,
        seoMissing: seoMissingCount.count ?? 0,
        schools: schoolsCount.count ?? 0,
      },
      activity: {
        issues: recentIssues.data ?? [],
        areas: recentAreas.data ?? [],
        events: recentEvents.data ?? [],
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(stats, {
      headers: {
        // Cache for 60 seconds, serve stale for 2 minutes while revalidating
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
