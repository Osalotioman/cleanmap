/**
 * Supabase Server Client
 * 
 * Server-side Supabase client with cookie management for SSR.
 * Provides both service role and user-context clients.
 * 
 * @module lib/supabase/server
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '../env';

/**
 * Creates a Supabase client for server-side usage with user context
 * 
 * This client:
 * - Reads/writes cookies for session management
 * - Operates in the user's auth context
 * - Use for user-authenticated operations
 * 
 * @example
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export async function GET() {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   return Response.json({ user });
 * }
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role key
 * 
 * This client:
 * - Uses service role key (bypasses RLS)
 * - Should only be used server-side
 * - Use for admin operations (user creation, etc.)
 * 
 * ⚠️ WARNING: This client bypasses Row Level Security.
 * Only use for trusted admin operations.
 * 
 * @example
 * import { createAdminClient } from '@/lib/supabase/server';
 * 
 * export async function POST(request: Request) {
 *   const supabase = createAdminClient();
 *   const { data, error } = await supabase.auth.admin.createUser({
 *     email: 'user@example.com',
 *     password: 'secure-password',
 *   });
 * }
 */
export function createAdminClient() {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for service role client
        },
      },
    }
  );
}
