import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * POST /api/admin/audit-log
 * Create an audit log entry
 */
export const POST = async (req: NextRequest) => {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = adminClient();

  try {
    const body = await req.json();
    const { action, resourceType, resourceId, changes } = body;
    
    // Get IP and user agent from headers
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create audit log entry
    const { data, error } = await sb.rpc('create_audit_log', {
      p_user_id: user?.id || null,
      p_user_email: user?.email || 'unknown',
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_changes: changes || null,
      p_ip_address: ip,
      p_user_agent: userAgent,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, logId: data });
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    );
  }
};

/**
 * GET /api/admin/audit-log
 * Retrieve audit logs
 */
export const GET = async (req: NextRequest) => {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = adminClient();

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error } = await sb.rpc('get_recent_audit_logs', {
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw error;

    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    console.error("Audit log fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
};
