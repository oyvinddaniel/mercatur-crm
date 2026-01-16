/**
 * Communication Detail Page
 *
 * Shows detailed information about a specific communication log
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getCommunication } from '@/app/actions/communications';
import { getCustomer } from '@/app/actions/customers';
import { getContact } from '@/app/actions/contacts';
import { DeleteCommunicationButton } from '../delete-button';

export default async function CommunicationDetailPage({
  params
}: {
  params: Promise<{ id: string; commId: string }>
}) {
  const { id: customerId, commId } = await params;
  const supabase = await createClient();

  // Check authentication
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  // Fetch communication
  const commResult = await getCommunication(commId);
  if (!('success' in commResult) || !commResult.success) {
    notFound();
  }
  const communication = commResult.data;

  // Fetch customer info
  const customerResult = await getCustomer(customerId);
  if (!('success' in customerResult) || !customerResult.success) {
    notFound();
  }
  const customer = customerResult.data;

  // Fetch contact if exists
  let contactName: string | null = null;
  if (communication.contact_id) {
    const contactResult = await getContact(communication.contact_id);
    if ('success' in contactResult && contactResult.success) {
      contactName = contactResult.data.full_name;
    }
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
          <Link
            href={`/customers/${customerId}/communications`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 block"
          >
            ← Tilbake til kommunikasjonslogg
          </Link>
          <div className="flex justify-between items-center mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{communication.subject}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Kunde:{' '}
                <Link href={`/customers/${customerId}`} className="text-blue-600 hover:underline">
                  {customer.company_name}
                </Link>
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/customers/${customerId}/communications/${commId}/edit`}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Rediger
              </Link>
              <DeleteCommunicationButton communicationId={commId} customerId={customerId} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detaljer</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(communication.communication_type)}`}>
                      {formatType(communication.communication_type)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dato og tid</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(communication.communication_date).toLocaleDateString('no-NO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
                {contactName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Kontaktperson</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <Link
                        href={`/customers/${customerId}/contacts/${communication.contact_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {contactName}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Description */}
            {communication.description && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Beskrivelse</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{communication.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Opprettet</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(communication.created_at).toLocaleDateString('no-NO')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sist oppdatert</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(communication.updated_at).toLocaleDateString('no-NO')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
