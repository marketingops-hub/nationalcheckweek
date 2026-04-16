import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/homepage-global-settings
 * Fetch global homepage settings (colors, theme, etc.)
 * Requires: Admin role
 */
export const GET = requireAdmin(async (req: NextRequest) => {
  try {
    const sb = adminClient();

    // Fetch global settings
    const { data, error } = await sb
      .from('homepage_global_settings')
      .select('*')
      .eq('setting_key', 'global_colors')
      .single();

    if (error) {
      console.error('[Global Settings API] Fetch error:', error);
      return NextResponse.json(
        { error: "Failed to fetch global settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: data?.setting_value || {},
      id: data?.id,
      updated_at: data?.updated_at,
    });

  } catch (err) {
    console.error('[Global Settings API] Error:', err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/admin/homepage-global-settings
 * Update global homepage settings
 * Requires: Admin role
 */
export const PATCH = requireAdmin(async (req: NextRequest) => {
  try {
    const sb = adminClient();
    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: "Invalid settings object" },
        { status: 400 }
      );
    }

    // Validate color values (basic hex/rgba validation)
    const colorKeys = [
      'primaryButton', 'primaryButtonText', 'secondaryButton', 
      'secondaryButtonText', 'heading', 'subheading', 'accentColor',
      'backgroundColor', 'textColor', 'ctaBackground', 'ctaText',
      'ctaPrimaryButton', 'borderColor', 'mutedText'
    ];

    for (const key of colorKeys) {
      if (settings[key] && typeof settings[key] !== 'string') {
        return NextResponse.json(
          { error: `Invalid color value for ${key}` },
          { status: 400 }
        );
      }
    }

    // Update or insert global settings
    const { data, error } = await sb
      .from('homepage_global_settings')
      .upsert({
        setting_key: 'global_colors',
        setting_value: settings,
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (error) {
      console.error('[Global Settings API] Update error:', error);
      return NextResponse.json(
        { error: "Failed to update global settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data.setting_value,
      updated_at: data.updated_at,
    });

  } catch (err) {
    console.error('[Global Settings API] Error:', err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
