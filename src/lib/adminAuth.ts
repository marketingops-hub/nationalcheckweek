/**
 * Admin Authentication & Authorization Utilities
 * Provides role-based access control without 3rd party dependencies
 */

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export interface AdminUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
}

/**
 * Check if the current user is an admin.
 * Uses cookie session for identity, service role key to bypass RLS on user_profiles.
 * @returns AdminUser if authenticated and admin, null otherwise
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  const sb = await createClient();

  // Check authentication via cookie session
  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError || !user) {
    return null;
  }

  // Use service role to bypass RLS when reading user_profiles
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  const serviceClient = createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileError } = await serviceClient
    .from('user_profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Verify admin or super_admin role
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    return null;
  }

  return {
    id: user.id,
    email: profile.email || user.email || '',
    role: profile.role as 'admin' | 'super_admin',
  };
}

// JSON-compatible value types for audit logging
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

/**
 * Audit log helper - logs admin actions to database
 */
export async function logAudit(params: {
  action: string;
  tableName: string;
  recordId?: string;
  oldValue?: JsonValue;
  newValue?: JsonValue;
}): Promise<void> {
  try {
    const sb = await createClient();
    
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    await sb.from('audit_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId || null,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
    });
  } catch (err) {
    console.error('[Audit Log] Failed to log action:', err);
    // Don't throw - audit logging shouldn't break the main flow
  }
}

/**
 * Middleware wrapper for admin-only API routes
 */
export async function withAdminAuth(
  handler: (req: NextRequest, admin: AdminUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    return handler(req, admin);
  };
}
