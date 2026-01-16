/**
 * Contacts Page
 *
 * Lists all contacts for a specific customer
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getContactsForCustomer } from '@/app/actions/contacts';
import { getCustomer } from '@/app/actions/customers';
import { DeleteContactButton } from './delete-button';
import type { Contact } from '@/types/database';

export default async function ContactsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createClient();

  // Check authentication
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  // Fetch customer info
  const customerResult = await getCustomer(customerId);
  if ('error' in customerResult) {
    notFound();
  }
  const customer = customerResult.data;

  // Fetch contacts for customer
  const contactsResult = await getContactsForCustomer(customerId);
  let contacts: Contact[] = [];
  let error: string | null = null;

  if ('error' in contactsResult) {
    error = contactsResult.error;
  } else {
    contacts = contactsResult.data;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/customers/${customerId}`} className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
            ← Tilbake til {customer.company_name}
          </Link>
          <div className="flex justify-between items-center mt-2">
            <h1 className="text-2xl font-bold text-gray-900">Kontaktpersoner</h1>
            <Link
              href={`/customers/${customerId}/contacts/new`}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              + Ny kontakt
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Kunne ikke laste kontakter: {error}
          </div>
        )}

        {contacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Ingen kontaktpersoner registrert ennå</p>
            <Link
              href={`/customers/${customerId}/contacts/new`}
              className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Legg til første kontakt
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Navn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stilling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/customers/${customerId}/contacts/${contact.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {contact.full_name}
                        {contact.is_primary && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Primær
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.job_title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.phone ? (
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        {contact.is_decision_maker && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Beslutningstaker
                          </span>
                        )}
                        {contact.department && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {contact.department}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/customers/${customerId}/contacts/${contact.id}/edit`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Rediger
                        </Link>
                        <DeleteContactButton contactId={contact.id} customerId={customerId} />
                      </div>
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
