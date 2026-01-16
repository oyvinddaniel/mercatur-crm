/**
 * Supabase Client for Client Components
 *
 * Use this in Client Components (with 'use client' directive)
 * This creates a browser-based Supabase client
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
