import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. Bypasses row-level security — server-only,
 * never import from client components. Returns null when the service key
 * is not configured so callers can degrade instead of crashing.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
