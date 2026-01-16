import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getDeal } from '@/app/actions/deals';
import { getCustomer } from '@/app/actions/customers';
import { DeleteDealButton } from './delete-button';

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params;
  const supabase = await createClient();

  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) redirect('/login');

  const dealResult = await getDeal(dealId);
  if (!('success' in dealResult) || !dealResult.success) notFound();
  const deal = dealResult.data;

  const customerResult = await getCustomer(deal.customer_id);
  const customer = ('success' in customerResult && customerResult.success) ? customerResult.data : null;

  const formatStage = (stage: string) => ({
    lead: 'Lead', qualified: 'Kvalifisert', proposal: 'Tilbud',
    negotiation: 'Forhandling', won: 'Vunnet', lost: 'Tapt'
  }[stage] || stage);

  const getStageColor = (stage: string) => ({
    lead: 'bg-gray-100 text-gray-800', qualified: 'bg-blue-100 text-blue-800',
    proposal: 'bg-purple-100 text-purple-800', negotiation: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800', lost: 'bg-red-100 text-red-800'
  }[stage] || 'bg-gray-100 text-gray-800');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/deals" className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">← Tilbake til deals</Link>
          <div className="flex justify-between items-center mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{deal.deal_name}</h1>
              {customer && <p className="text-sm text-gray-600 mt-1">Kunde: <Link href={`/customers/${deal.customer_id}`} className="text-blue-600 hover:underline">{customer.company_name}</Link></p>}
            </div>
            <div className="flex gap-2">
              <Link href={`/deals/${dealId}/edit`} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Rediger</Link>
              <DeleteDealButton dealId={dealId} />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detaljer</h2>
              <dl className="space-y-4">
                <div><dt className="text-sm font-medium text-gray-500">Verdi</dt><dd className="mt-1 text-sm text-gray-900">{deal.deal_value.toLocaleString('no-NO')} {deal.currency}</dd></div>
                <div><dt className="text-sm font-medium text-gray-500">Status</dt><dd className="mt-1"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStageColor(deal.stage)}`}>{formatStage(deal.stage)}</span></dd></div>
                <div><dt className="text-sm font-medium text-gray-500">Sannsynlighet</dt><dd className="mt-1 text-sm text-gray-900">{deal.probability}%</dd></div>
                {deal.expected_close_date && <div><dt className="text-sm font-medium text-gray-500">Forventet avslutning</dt><dd className="mt-1 text-sm text-gray-900">{new Date(deal.expected_close_date).toLocaleDateString('no-NO')}</dd></div>}
                {deal.actual_close_date && <div><dt className="text-sm font-medium text-gray-500">Faktisk avslutning</dt><dd className="mt-1 text-sm text-gray-900">{new Date(deal.actual_close_date).toLocaleDateString('no-NO')}</dd></div>}
              </dl>
            </div>
            {deal.notes && <div className="bg-white shadow rounded-lg p-6"><h2 className="text-lg font-semibold text-gray-900 mb-4">Notater</h2><p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p></div>}
          </div>
          <div className="bg-white shadow rounded-lg p-6"><h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2><dl className="space-y-3"><div><dt className="text-sm font-medium text-gray-500">Opprettet</dt><dd className="mt-1 text-sm text-gray-900">{new Date(deal.created_at).toLocaleDateString('no-NO')}</dd></div><div><dt className="text-sm font-medium text-gray-500">Sist oppdatert</dt><dd className="mt-1 text-sm text-gray-900">{new Date(deal.updated_at).toLocaleDateString('no-NO')}</dd></div></dl></div>
        </div>
      </main>
    </div>
  );
}
