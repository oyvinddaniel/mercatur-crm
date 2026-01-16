/**
 * Dashboard Page
 *
 * Main dashboard after login - protected route
 * Shows overview and navigation to main features
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import { LogoutButton } from './logout-button';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication and ensure profile (Layer 3 defense)
  const authCheck = await checkAuthAndEnsureProfile(supabase);

  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  const { user, profile } = authCheck;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Mercatur CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile?.full_name || user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Velkommen, {profile?.full_name || 'bruker'}!
          </h2>
          <p className="mt-2 text-gray-600">
            Dette er ditt Mercatur CRM dashboard. Her får du oversikt over kunder, kontakter og salg.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-blue-600 text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kunder</h3>
            <p className="text-gray-600 text-sm mb-4">
              Administrer kundedatabasen
            </p>
            <a
              href="/customers"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Gå til kunder →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-green-600 text-3xl mb-3">📞</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kontakter</h3>
            <p className="text-gray-600 text-sm mb-4">
              Administrer kontaktpersoner
            </p>
            <a
              href="/contacts"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Gå til kontakter →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-purple-600 text-3xl mb-3">💼</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deals</h3>
            <p className="text-gray-600 text-sm mb-4">
              Følg opp salgsmuligheter
            </p>
            <a
              href="/deals"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Gå til deals →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-orange-600 text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapporter</h3>
            <p className="text-gray-600 text-sm mb-4">
              Se statistikk og analyse
            </p>
            <span className="text-gray-400 text-sm">Kommer snart</span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hurtigstatistikk</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Totalt kunder</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Aktive deals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Hendelser denne uken</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
