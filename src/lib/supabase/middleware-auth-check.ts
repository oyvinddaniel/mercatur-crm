/**
 * Authentication Middleware Helper
 *
 * This runs on EVERY request and ensures:
 * 1. User session is valid
 * 2. Profile exists for authenticated users (Layer 3 defense)
 * 3. last_login_at is updated
 *
 * Usage: Call this in middleware.ts or layout.tsx
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
import { ensureProfile, updateLastLogin } from './ensure-profile';

interface AuthCheckResult {
  authenticated: boolean;
  user?: User;
  profile?: any;
  error?: string;
}

/**
 * Performs authentication check and ensures profile exists
 *
 * This should be called on protected routes to verify:
 * - User is authenticated
 * - User has a profile
 *
 * @param supabase - Supabase client instance
 * @returns Auth check result
 */
export async function checkAuthAndEnsureProfile(
  supabase: SupabaseClient
): Promise<AuthCheckResult> {

  try {
    // Step 1: Get current session
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return {
        authenticated: false,
        error: sessionError?.message || 'No active session'
      };
    }

    // Step 2: Ensure profile exists (Layer 3 defense)
    const profileResult = await ensureProfile(supabase, user);

    if (!profileResult.success) {
      console.error('⚠️ Profile check failed, but user is authenticated');
      // User is authenticated but profile is missing/failed
      // Allow login but log the issue
    }

    // Step 3: Update last login timestamp (async, non-blocking)
    updateLastLogin(supabase, user.id).catch(err => {
      console.error('⚠️ Failed to update last_login_at:', err);
    });

    return {
      authenticated: true,
      user,
      profile: profileResult.profile,
    };

  } catch (err) {
    console.error('❌ Auth check failed:', err);
    return {
      authenticated: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Guard for protected routes
 * Redirects to /login if not authenticated
 *
 * @param supabase - Supabase client instance
 * @param redirectTo - Where to redirect if not authenticated (default: /login)
 * @returns Auth result or throws redirect
 */
export async function requireAuth(
  supabase: SupabaseClient,
  redirectTo: string = '/login'
): Promise<{ user: User; profile: any }> {

  const authCheck = await checkAuthAndEnsureProfile(supabase);

  if (!authCheck.authenticated || !authCheck.user) {
    // In Next.js Server Components, use redirect() from 'next/navigation'
    // In Client Components, use router.push()
    throw new Error(`Redirect to ${redirectTo}`);
  }

  return {
    user: authCheck.user,
    profile: authCheck.profile,
  };
}
