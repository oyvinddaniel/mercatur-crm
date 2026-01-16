/**
 * Customer Detail Page
 *
 * Shows detailed information about a specific customer
 * Uses secure Server Actions with IDOR protection
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { DeleteCustomerButton } from './delete-button';
import { getCustomer } from '@/app/actions/customers';
import type { CustomerWithStats } from '@/types/database';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  // Fetch customer using secure Server Action
  const result = await getCustomer(id);

  if ('error' in result) {
    notFound();
  }

  const customer: CustomerWithStats = result.data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/customers" className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
            ← Tilbake til kunder
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{customer.company_name}</h1>
            <div className="flex gap-2">
              <Link
                href={`/customers/${id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Rediger
              </Link>
              <DeleteCustomerButton customerId={id} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Firmainformasjon</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organisasjonsnummer</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.org_number || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bransje</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.industry || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.address || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nettside</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {customer.website ? (
                      <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {customer.website}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead-kilde</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.lead_source || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Årlig omsetning</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {customer.annual_revenue ? `${customer.annual_revenue.toLocaleString('no-NO')} NOK` : '-'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notater</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Livssyklus</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {customer.lifecycle_stage || 'ukjent'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Kundestatus</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.customer_status === 'active' ? 'bg-green-100 text-green-800' :
                      customer.customer_status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      customer.customer_status === 'potential' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {customer.customer_status || 'ukjent'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Neste kontakt</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {customer.next_contact_date || '-'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Oversikt</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Kontakter</dt>
                  <dd className="text-sm font-semibold text-gray-900">{customer.contact_count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Deals</dt>
                  <dd className="text-sm font-semibold text-gray-900">{customer.deal_count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Kommunikasjon</dt>
                  <dd className="text-sm font-semibold text-gray-900">{customer.communication_count}</dd>
                </div>
              </dl>
            </div>

            {/* Timestamps */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Opprettet</dt>
                  <dd className="text-gray-900">{new Date(customer.created_at).toLocaleDateString('no-NO')}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Sist oppdatert</dt>
                  <dd className="text-gray-900">{new Date(customer.updated_at).toLocaleDateString('no-NO')}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
