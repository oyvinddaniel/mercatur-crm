import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getDeal } from '@/app/actions/deals';
import { DealForm } from '../../deal-form';

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params;
  const supabase = await createClient();

  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) redirect('/login');

  const dealResult = await getDeal(dealId);
  if (!('success' in dealResult) || !dealResult.success) notFound();
  const deal = dealResult.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/deals/${dealId}`} className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">← Tilbake til deal</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Rediger deal</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <DealForm mode="edit" userId={authCheck.user.id} deal={deal} />
        </div>
      </main>
    </div>
  );
}
