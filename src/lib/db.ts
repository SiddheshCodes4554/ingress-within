import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_supabase_key_for_client_bundle';

if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('CRITICAL: NEXT_PUBLIC_SUPABASE_URL environment variable is missing.');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('CRITICAL: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');
  }
}

// Service role client bypasses RLS for admin-level operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Dedicated auth client to prevent session pollution on the main db client
export const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

