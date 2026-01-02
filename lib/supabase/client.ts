/**
 * Supabase Browser Client
 * 
 * Client-side Supabase client for browser usage.
 * Uses the public anon key and is safe to use in the browser.
 * 
 * @module lib/supabase/client
 */

import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';

/**
 * Creates a Supabase client for browser/client-side usage
 * 
 * This client:
 * - Uses the public anon key
 * - Automatically handles session management
 * - Can be used in Client Components
 * 
 * @example
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * const supabase = createClient();
 * const { data } = await supabase.auth.getUser();
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
