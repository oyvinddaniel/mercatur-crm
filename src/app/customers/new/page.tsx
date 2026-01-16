/**
 * New Customer Page
 *
 * Form for creating a new customer
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { CustomerForm } from '../customer-form';

export default async function NewCustomerPage() {
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
          <Link href="/customers" className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
            ← Tilbake til kunder
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Opprett ny kunde</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <CustomerForm mode="create" userId={authCheck.user.id} />
        </div>
      </main>
    </div>
  );
}
