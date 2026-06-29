import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export type StaffRole = 'editor' | 'admin' | 'super_admin';

export interface AdminUser {
  id: string;
  email: string;
  role: StaffRole;
}

/**
 * A NextRequest decorated by `requireAdmin` / `requireStaff` with the
 * authenticated user. Wrapped handlers can read `(req as AuthedRequest).user`
 * to attribute records — e.g. stamp `created_by` / `added_by` with the staff
 * member who performed the action.
 */
export interface AuthedRequest extends NextRequest {
  user: AdminUser;
}

/**
 * Verify a Bearer token and return the user IF their role is in `allowed`.
 * Returns the authenticated user (with role + email) or null.
 */
type AuthResult =
  | { ok: true; user: AdminUser }
  | { ok: false; reason: string; status: number };

/**
 * Full auth check that reports WHY it failed (token vs profile vs role), so
 * the 401/403 the client sees names the cause instead of a generic
 * "Unauthorized". Never throws — any unexpected error becomes a reason.
 */
async function verifyAuthDetailed(
  req: NextRequest,
  allowed: readonly StaffRole[],
): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { ok: false, reason: 'no bearer token on request', status: 401 };
    }
    const token = authHeader.substring(7);

    // Verify the token via the anon client.
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error } = await anonClient.auth.getUser(token);
    if (error || !user) {
      return { ok: false, reason: `invalid session token${error ? ` (${error.message})` : ''}`, status: 401 };
    }

    // Resolve role via service-role client (bypasses RLS on user_profiles).
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: profile, error: pErr } = await serviceClient
      .from('user_profiles')
      .select('role, email')
      .eq('id', user.id)
      .maybeSingle();

    if (pErr) {
      return { ok: false, reason: `profile lookup failed (${pErr.message})`, status: 500 };
    }
    if (!profile) {
      return { ok: false, reason: 'no user_profiles row for this account', status: 403 };
    }

    // Normalise the stored role — tolerate casing/whitespace ("Editor", "admin ").
    const role = (profile.role ?? '').toString().trim().toLowerCase() as StaffRole;
    if (!allowed.includes(role)) {
      return { ok: false, reason: `role '${role || '(empty)'}' not permitted (need ${allowed.join('/')})`, status: 403 };
    }

    return { ok: true, user: { ...user, role, email: profile.email || user.email || '' } as AdminUser };
  } catch (e) {
    return { ok: false, reason: `auth check errored (${e instanceof Error ? e.message : String(e)})`, status: 500 };
  }
}

/**
 * Verify a Bearer token and return the user IF their role is in `allowed`.
 * Returns the authenticated user (with role + email) or null. Thin wrapper
 * kept for existing callers that only need user|null.
 */
async function verifyAuth(req: NextRequest, allowed: readonly StaffRole[]) {
  const r = await verifyAuthDetailed(req, allowed);
  return r.ok ? r.user : null;
}

/**
 * Verify admin authentication from request headers.
 * Checks the Bearer token AND verifies user_profiles.role = admin|super_admin.
 * Returns the authenticated user or null.
 */
export async function verifyAdminAuth(req: NextRequest) {
  return verifyAuth(req, ['admin', 'super_admin']);
}

/**
 * Like verifyAdminAuth but also accepts the 'editor' role. Use for content
 * endpoints that editors are allowed to operate (per rbac.ts EDITOR_PATHS).
 */
export async function verifyStaffAuth(req: NextRequest) {
  return verifyAuth(req, ['editor', 'admin', 'super_admin']);
}

/**
 * Middleware wrapper that requires admin authentication (admin|super_admin).
 * Usage: export const GET = requireAdmin(async (req) => { ... });
 * For dynamic routes: export const GET = requireAdmin(async (req, context) => { ... });
 */
export function requireAdmin<T = any>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T) => {
    const r = await verifyAuthDetailed(req, ['admin', 'super_admin']);
    if (!r.ok) {
      return NextResponse.json(
        { error: `Unauthorized — ${r.reason}.` },
        { status: r.status }
      );
    }
    // Expose the verified user so handlers can attribute records.
    (req as AuthedRequest).user = r.user;
    return handler(req, context);
  };
}

/**
 * Middleware wrapper that requires staff authentication (editor|admin|
 * super_admin). Use for content-management endpoints editors may operate.
 */
export function requireStaff<T = any>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T) => {
    const r = await verifyAuthDetailed(req, ['editor', 'admin', 'super_admin']);
    if (!r.ok) {
      return NextResponse.json(
        { error: `Unauthorized — ${r.reason}.` },
        { status: r.status }
      );
    }
    // Expose the verified user so handlers can attribute records.
    (req as AuthedRequest).user = r.user;
    return handler(req, context);
  };
}

/**
 * Validate URL to prevent SSRF attacks
 * Only allows safe external URLs
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS protocols allowed' };
    }

    // Block localhost and private IP ranges
    const hostname = parsed.hostname.toLowerCase();
    
    // Block localhost variants and IPv6 loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Localhost URLs not allowed' };
    }

    // Block 0.0.0.0 (binds to all interfaces, OS-dependent behaviour)
    if (hostname === '0.0.0.0') {
      return { valid: false, error: 'Reserved IP addresses not allowed' };
    }

    // Block private IPv4 ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = hostname.match(ipv4Regex);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254)
      ) {
        return { valid: false, error: 'Private IP addresses not allowed' };
      }
    }

    // Block private / link-local IPv6 ranges
    // Covers: fe80::/10 (link-local), fc00::/7 (ULA), ::1 already covered above
    const strippedV6 = hostname.startsWith('[') ? hostname.slice(1, -1) : hostname;
    if (
      strippedV6.startsWith('fe80') ||
      strippedV6.startsWith('fc') ||
      strippedV6.startsWith('fd')
    ) {
      return { valid: false, error: 'Private IPv6 addresses not allowed' };
    }

    // Block internal domains
    const blockedDomains = [
      'supabase.co',
      'supabase.com',
      'metadata.google.internal',
      'internal',
      '.local',
    ];
    
    if (blockedDomains.some(blocked => hostname.includes(blocked))) {
      return { valid: false, error: 'Internal domains not allowed' };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize filename to prevent path traversal and extension bypass
 */
export function sanitizeFilename(filename: string, allowedExtensions: string[]): {
  safe: string;
  valid: boolean;
  error?: string;
} {
  // Remove path components
  const basename = filename.split('/').pop()?.split('\\').pop() || '';
  
  // Remove dangerous characters
  const cleaned = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Get extension (only the last one)
  const parts = cleaned.split('.');
  if (parts.length < 2) {
    return { safe: cleaned, valid: false, error: 'No file extension' };
  }
  
  const ext = parts.pop()!.toLowerCase();
  const nameWithoutExt = parts.join('.');
  
  // Validate extension
  if (!allowedExtensions.includes(ext)) {
    return {
      safe: cleaned,
      valid: false,
      error: `Extension .${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}`
    };
  }
  
  // Prevent double extensions like .jpg.php
  const secondExt = parts[parts.length - 1]?.toLowerCase();
  const executableExts = ['php', 'js', 'exe', 'sh', 'bat', 'cmd', 'py', 'rb', 'pl'];
  if (secondExt && executableExts.includes(secondExt)) {
    return {
      safe: cleaned,
      valid: false,
      error: 'Double extensions with executable types not allowed'
    };
  }
  
  return { safe: `${nameWithoutExt}.${ext}`, valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * Validate redirect URL against whitelist
 */
export function validateRedirectUrl(url: string, allowedDomains: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
