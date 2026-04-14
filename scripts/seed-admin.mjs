import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qxcdeyvfeipyfojpxosh.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY env var is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@admin.com',
  password: 'admin1234',
  email_confirm: true,
});

if (error) {
  console.error('❌ Failed to create admin user:', error.message);
} else {
  console.log('✅ Admin user created:', data.user.email);
}
