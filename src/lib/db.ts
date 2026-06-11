import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  if (!supabaseUrl) {
    throw new Error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL environment variable is missing.');
  }
  if (!supabaseServiceKey) {
    throw new Error(
      'CRITICAL: SUPABASE_SERVICE_ROLE_KEY environment variable is missing. ' +
      'Please RESTART your development server (e.g. npm run dev) so Next.js can load your .env file changes.'
    );
  }
}

// Service role client bypasses RLS for admin-level operations (e.g. querying/updating otp_verifications)
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

