/**
 * Contact Detail Page
 *
 * Shows detailed information about a specific contact
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getContact } from '@/app/actions/contacts';
import { getCustomer } from '@/app/actions/customers';
import { DeleteContactButton } from '../delete-button';

export default async function ContactDetailPage({
  params
}: {
  params: Promise<{ id: string; contactId: string }>
}) {
  const { id: customerId, contactId } = await params;
  const supabase = await createClient();

  // Check authentication
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  // Fetch contact
  const contactResult = await getContact(contactId);
  if ('error' in contactResult) {
    notFound();
  }
  const contact = contactResult.data;

  // Fetch customer info
  const customerResult = await getCustomer(customerId);
  if ('error' in customerResult) {
    notFound();
  }
  const customer = customerResult.data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/customers/${customerId}/contacts`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 block"
          >
            ← Tilbake til kontakter
          </Link>
          <div className="flex justify-between items-center mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contact.full_name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Kontakt hos{' '}
                <Link href={`/customers/${customerId}`} className="text-blue-600 hover:underline">
                  {customer.company_name}
                </Link>
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/customers/${customerId}/contacts/${contactId}/edit`}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Rediger
              </Link>
              <DeleteContactButton contactId={contactId} customerId={customerId} />
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontaktinformasjon</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-postadresse</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    ) : (
                      '-'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                        {contact.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stillingstittel</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.job_title || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Avdeling</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.department || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contact.linkedin_url ? (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Se profil →
                      </a>
                    ) : (
                      '-'
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Notes */}
            {contact.notes && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notater</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Primærkontakt</dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {contact.is_primary ? (
                      <span className="text-blue-600">Ja</span>
                    ) : (
                      <span className="text-gray-400">Nei</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Beslutningstaker</dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {contact.is_decision_maker ? (
                      <span className="text-purple-600">Ja</span>
                    ) : (
                      <span className="text-gray-400">Nei</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Opprettet</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(contact.created_at).toLocaleDateString('no-NO')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sist oppdatert</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(contact.updated_at).toLocaleDateString('no-NO')}
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
