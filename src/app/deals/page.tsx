/**
 * Deals Page
 *
 * Lists all deals for the authenticated user
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getAllDeals } from '@/app/actions/deals';
import type { Deal } from '@/types/database';

export default async function DealsPage() {
  const supabase = await createClient();

  // Check authentication
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  // Fetch all deals
  const dealsResult = await getAllDeals();
  let deals: Deal[] = [];
  let error: string | null = null;

  if ('success' in dealsResult && dealsResult.success) {
    deals = dealsResult.data;
  } else if ('error' in dealsResult) {
    error = dealsResult.error;
  }

  // Helper functions
  const formatStage = (stage: string) => {
    const stages: Record<string, string> = {
      lead: 'Lead',
      qualified: 'Kvalifisert',
      proposal: 'Tilbud',
      negotiation: 'Forhandling',
      won: 'Vunnet',
      lost: 'Tapt',
    };
    return stages[stage] || stage;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-gray-100 text-gray-800',
      qualified: 'bg-blue-100 text-blue-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-yellow-100 text-yellow-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
            ← Tilbake til dashboard
          </Link>
          <div className="flex justify-between items-center mt-2">
            <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
            <Link
              href="/deals/new"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              + Ny deal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Kunne ikke laste deals: {error}
          </div>
        )}

        {deals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Ingen deals registrert ennå</p>
            <Link
              href="/deals/new"
              className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Opprett første deal
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verdi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sannsynlighet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forventet avslutning
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {deal.deal_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deal.deal_value.toLocaleString('no-NO')} {deal.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStageColor(deal.stage)}`}>
                        {formatStage(deal.stage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deal.probability}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deal.expected_close_date
                        ? new Date(deal.expected_close_date).toLocaleDateString('no-NO')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/deals/${deal.id}/edit`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Rediger
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
