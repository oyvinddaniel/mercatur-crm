/**
 * Profile Existence Guard
 *
 * This utility ensures that a profile always exists for authenticated users.
 * It implements a "defense in depth" strategy with 3 layers:
 *
 * Layer 1: Database trigger (on auth.users INSERT)
 * Layer 2: Explicit creation during signup
 * Layer 3: Fallback check on every login (this file)
 *
 * This solves the common issue where users register via Supabase Auth
 * but their profile is not created in the profiles table.
 */

import { SupabaseClient, User } from '@supabase/supabase-js';

interface EnsureProfileOptions {
  fullName?: string;
  forceCreate?: boolean;
}

/**
 * Ensures a profile exists for the given user.
 * If profile doesn't exist, creates it.
 *
 * @param supabase - Supabase client instance
 * @param user - Authenticated user from auth.users
 * @param options - Optional: full_name and forceCreate flag
 * @returns Profile data or null if failed
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  options: EnsureProfileOptions = {}
): Promise<{ success: boolean; profile?: any; error?: string }> {

  try {
    // Step 1: Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = row not found (expected if profile doesn't exist)
      console.error('Error fetching profile:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Step 2: If profile exists and we're not forcing recreation, return it
    if (existingProfile && !options.forceCreate) {
      console.log('✅ Profile exists for user:', user.id);
      return { success: true, profile: existingProfile };
    }

    // Step 3: Profile doesn't exist (or forceCreate=true), create it
    console.log('⚠️ Profile missing for user:', user.id, '- Creating now...');

    // Determine full_name from multiple sources (priority order)
    const fullName =
      options.fullName || // 1. Explicitly provided
      user.user_metadata?.full_name || // 2. From user metadata
      user.email?.split('@')[0] || // 3. From email (before @)
      'New User'; // 4. Fallback

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: fullName,
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create profile:', createError);
      return { success: false, error: createError.message };
    }

    console.log('✅ Profile created successfully:', newProfile);
    return { success: true, profile: newProfile };

  } catch (err) {
    console.error('❌ Unexpected error in ensureProfile:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Updates last_login_at for the user's profile
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 */
export async function updateLastLogin(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    console.log('✅ Updated last_login_at for user:', userId);
  } catch (err) {
    console.error('⚠️ Failed to update last_login_at:', err);
    // Don't throw - this is non-critical
  }
}

/**
 * Signup helper that ensures profile is created
 * Use this instead of supabase.auth.signUp() directly
 *
 * @param supabase - Supabase client instance
 * @param email - User email
 * @param password - User password
 * @param fullName - User's full name
 * @returns Signup result with profile guarantee
 */
export async function signUpWithProfile(
  supabase: SupabaseClient,
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; user?: User; error?: string }> {

  try {
    // Step 1: Sign up with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // Store in user_metadata for trigger
        },
      },
    });

    if (signUpError) {
      console.error('❌ Signup failed:', signUpError);
      return { success: false, error: signUpError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'No user returned from signup' };
    }

    console.log('✅ User created in auth.users:', authData.user.id);

    // Step 2: Explicitly ensure profile exists (defense in depth)
    // Even though we have a trigger, we double-check here
    await ensureProfile(supabase, authData.user, { fullName });

    return { success: true, user: authData.user };

  } catch (err) {
    console.error('❌ Unexpected error in signUpWithProfile:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
