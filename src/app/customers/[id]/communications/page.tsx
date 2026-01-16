/**
 * Communications Page
 *
 * Lists all communication logs for a specific customer
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getCommunicationsForCustomer } from '@/app/actions/communications';
import { getCustomer } from '@/app/actions/customers';
import { DeleteCommunicationButton } from './delete-button';
import type { CommunicationLog } from '@/types/database';

export default async function CommunicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createClient();

  // Check authentication
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  // Fetch customer info
  const customerResult = await getCustomer(customerId);
  if (!('success' in customerResult) || !customerResult.success) {
    notFound();
  }
  const customer = customerResult.data;

  // Fetch communications for customer
  const commsResult = await getCommunicationsForCustomer(customerId);
  let communications: CommunicationLog[] = [];
  let error: string | null = null;

  if ('success' in commsResult && commsResult.success) {
    communications = commsResult.data;
  } else if ('error' in commsResult) {
    error = commsResult.error;
  }

  // Helper function to format communication type
  const formatType = (type: string) => {
    const types: Record<string, string> = {
      meeting: 'Møte',
      email: 'E-post',
      phone: 'Telefon',
      other: 'Annet',
    };
    return types[type] || type;
  };

  // Helper function to get type color
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'bg-blue-100 text-blue-800',
      email: 'bg-green-100 text-green-800',
      phone: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/customers/${customerId}`} className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
            ← Tilbake til {customer.company_name}
          </Link>
          <div className="flex justify-between items-center mt-2">
            <h1 className="text-2xl font-bold text-gray-900">Kommunikasjonslogg</h1>
            <Link
              href={`/customers/${customerId}/communications/new`}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              + Ny hendelse
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Kunne ikke laste kommunikasjonslogg: {error}
          </div>
        )}

        {communications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Ingen kommunikasjon registrert ennå</p>
            <Link
              href={`/customers/${customerId}/communications/new`}
              className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Logg første hendelse
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {communications.map((comm) => (
              <div key={comm.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(comm.communication_type)}`}>
                        {formatType(comm.communication_type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(comm.communication_date).toLocaleDateString('no-NO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <Link
                      href={`/customers/${customerId}/communications/${comm.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {comm.subject}
                    </Link>
                    {comm.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {comm.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/customers/${customerId}/communications/${comm.id}/edit`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Rediger
                    </Link>
                    <DeleteCommunicationButton communicationId={comm.id} customerId={customerId} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
