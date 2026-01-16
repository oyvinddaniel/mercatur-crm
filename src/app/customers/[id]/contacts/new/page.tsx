/**
 * New Contact Page
 *
 * Form for creating a new contact for a customer
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { getCustomer } from '@/app/actions/customers';
import { ContactForm } from '../contact-form';

export default async function NewContactPage({ params }: { params: Promise<{ id: string }> }) {
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
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Ny kontaktperson for {customer.company_name}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <ContactForm mode="create" customerId={customerId} userId={authCheck.user.id} />
        </div>
      </main>
    </div>
  );
}
