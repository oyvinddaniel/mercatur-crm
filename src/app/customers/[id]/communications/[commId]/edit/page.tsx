/**
 * Edit Communication Page
 *
 * Form for editing an existing communication log
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getCommunication } from '@/app/actions/communications';
import { getCustomer } from '@/app/actions/customers';
import { getContactsForCustomer } from '@/app/actions/contacts';
import { CommunicationForm } from '../../communication-form';

export default async function EditCommunicationPage({
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

  // Fetch contacts for customer (for dropdown)
  const contactsResult = await getContactsForCustomer(customerId);
  const contacts = 'success' in contactsResult && contactsResult.success ? contactsResult.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/customers/${customerId}/communications/${commId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 block"
          >
            ← Tilbake til hendelse
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Rediger hendelse
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Kunde: {customer.company_name}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <CommunicationForm
            mode="edit"
            customerId={customerId}
            userId={authCheck.user.id}
            contacts={contacts}
            communication={communication}
          />
        </div>
      </main>
    </div>
  );
}
