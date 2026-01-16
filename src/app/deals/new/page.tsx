import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { DealForm } from '../deal-form';

export default async function NewDealPage() {
  const supabase = await createClient();
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) redirect('/login');

  // Fetch customers for dropdown
  const { data: customers } = await supabase
    .from('customers')
    .select('id, company_name')
    .eq('assigned_to', authCheck.user.id)
    .order('company_name')
    .limit(100);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/deals" className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">← Tilbake til deals</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Ny deal</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <DealForm mode="create" userId={authCheck.user.id} customers={customers || []} />
        </div>
      </main>
    </div>
  );
}
