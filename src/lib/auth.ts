import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
}

/**
 * Verify admin authentication from request headers.
 * Checks the Bearer token AND verifies user_profiles.role = admin|super_admin.
 * Returns the authenticated user or null.
 */
export async function verifyAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  // Verify the token via the anon client
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  // Check role via service-role client (bypasses RLS on user_profiles)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return null;
  }

  return { ...user, role: profile.role as 'admin' | 'super_admin', email: profile.email || user.email || '' };
}

/**
 * Middleware wrapper that requires admin authentication
 * Usage: export const GET = requireAdmin(async (req) => { ... });
 * For dynamic routes: export const GET = requireAdmin(async (req, context) => { ... });
 */
export function requireAdmin<T = any>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T) => {
    const user = await verifyAdminAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }
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
