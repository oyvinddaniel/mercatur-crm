/**
 * Edit Contact Page
 *
 * Form for editing an existing contact
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getContact } from '@/app/actions/contacts';
import { getCustomer } from '@/app/actions/customers';
import { ContactForm } from '../../contact-form';

export default async function EditContactPage({
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
            href={`/customers/${customerId}/contacts/${contactId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 block"
          >
            ← Tilbake til kontakt
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Rediger {contact.full_name}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Kontakt hos {customer.company_name}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <ContactForm
            mode="edit"
            customerId={customerId}
            userId={authCheck.user.id}
            contact={contact}
          />
        </div>
      </main>
    </div>
  );
}
