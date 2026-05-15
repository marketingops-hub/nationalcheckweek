import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";

export const runtime = "edge";

// GET /api/admin/site-settings
export const GET = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();

  const { data, error } = await sb
    .from("home_hero_settings")
    .select("logo_url, logo_height")
    .eq("id", "00000000-0000-0000-0000-000000000001")
    .maybeSingle();

  if (error) {
    console.error("[Site Settings] Fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    settings: data || { logo_url: '/logo/nciw_no_background-1024x577.png', logo_height: 160 }
  });
});

// POST /api/admin/site-settings
export const POST = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const body = await req.json();

  if (!body.logo_url || !body.logo_height) {
    return NextResponse.json(
      { error: "logo_url and logo_height are required" },
      { status: 400 }
    );
  }

  // Check if settings exist
  const { data: existing } = await sb
    .from("home_hero_settings")
    .select("id")
    .eq("id", "00000000-0000-0000-0000-000000000001")
    .maybeSingle();

  let data, error;

  if (existing) {
    // Update existing settings
    ({ data, error } = await sb
      .from("home_hero_settings")
      .update({
        logo_url: body.logo_url,
        logo_height: body.logo_height,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .select()
      .single());
  } else {
    // Insert new settings
    ({ data, error } = await sb
      .from("home_hero_settings")
      .insert({
        id: "00000000-0000-0000-0000-000000000001",
        logo_url: body.logo_url,
        logo_height: body.logo_height,
        primary_cta_text: "Register Now",
        primary_cta_link: "/events",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single());
  }

  if (error) {
    console.error("[Site Settings] Save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data, success: true });
});
