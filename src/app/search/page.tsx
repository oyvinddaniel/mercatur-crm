/**
 * Search Page
 *
 * Global search across all entities
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { SearchForm } from './search-form';

export default async function SearchPage() {
  const supabase = await createClient();

  // Check authentication
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
            ← Tilbake til dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Søk</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchForm />
      </main>
    </div>
  );
}
