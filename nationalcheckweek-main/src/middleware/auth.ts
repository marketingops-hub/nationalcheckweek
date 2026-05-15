/**
 * Authentication middleware for protected routes
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const supabase = await createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    redirect('/login');
  }
  
  return session;
}

export async function getAuthUser() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  return user;
}
