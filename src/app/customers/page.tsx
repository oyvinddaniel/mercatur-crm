/**
 * Customers Page
 *
 * Lists all customers with search, filter, and CRUD operations
 * Uses secure Server Actions with pagination
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import Link from 'next/link';
import { CustomersTable } from './customers-table';
import { getCustomers } from '@/app/actions/customers';
import type { CustomerWithStats } from '@/types/database';

interface CustomersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const supabase = await createClient();

  // Check authentication
  const authCheck = await checkAuthAndEnsureProfile(supabase);
  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  // Get page from search params
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  // Fetch customers with pagination using Server Action
  const result = await getCustomers(page, 50);

  let customers: CustomerWithStats[] = [];
  let totalPages = 1;
  let error: string | null = null;

  if ('error' in result) {
    error = result.error;
    console.error('Error fetching customers:', error);
  } else {
    customers = result.data.customers;
    totalPages = result.data.totalPages;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
              ← Tilbake til dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
          </div>
          <Link
            href="/customers/new"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Ny kunde
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Kunne ikke laste kunder: {error}
          </div>
        )}

        <CustomersTable customers={customers || []} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/customers?page=${page - 1}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Forrige
              </Link>
            )}
            <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md">
              Side {page} av {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/customers?page=${page + 1}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Neste →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
