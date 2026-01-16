/**
 * Edit Customer Page
 *
 * Form for editing an existing customer
 * Uses secure Server Actions with IDOR protection
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { CustomerForm } from '../../customer-form';
import { getCustomer } from '@/app/actions/customers';
import type { Customer } from '@/types/database';

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
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

  const customer: Customer = result.data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/customers/${id}`} className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
            ← Tilbake til kunde
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Rediger {customer.company_name}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <CustomerForm mode="edit" userId={authCheck.user.id} customer={customer} />
        </div>
      </main>
    </div>
  );
}
