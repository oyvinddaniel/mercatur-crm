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
import { getDashboardStats, getRecentActivity } from '@/app/actions/dashboard';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication and ensure profile (Layer 3 defense)
  const authCheck = await checkAuthAndEnsureProfile(supabase);

  if (!authCheck.authenticated || !authCheck.user) {
    redirect('/login');
  }

  const { user, profile } = authCheck;

  // Fetch dashboard statistics
  const statsResult = await getDashboardStats();
  const stats = 'success' in statsResult && statsResult.success ? statsResult.data : null;

  // Fetch recent activity
  const activityResult = await getRecentActivity();
  const recentActivities = 'success' in activityResult && activityResult.success ? activityResult.data : [];

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
          <div className="mt-4">
            <Link
              href="/search"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              🔍 Søk i CRM
            </Link>
          </div>
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
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalCustomers}</div>
                <div className="text-sm text-gray-600 mt-1">Totalt kunder</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalContacts}</div>
                <div className="text-sm text-gray-600 mt-1">Totalt kontakter</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.activeDeals}</div>
                <div className="text-sm text-gray-600 mt-1">Aktive deals</div>
                {stats.activeDealValue > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.activeDealValue.toLocaleString('no-NO')} NOK
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.recentCommunications}</div>
                <div className="text-sm text-gray-600 mt-1">Hendelser siste 7 dager</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Kunne ikke laste statistikk
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        {recentActivities.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Siste aktivitet</h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {activity.type === 'customer' && <span className="text-xl">👥</span>}
                    {activity.type === 'contact' && <span className="text-xl">📞</span>}
                    {activity.type === 'deal' && <span className="text-xl">💼</span>}
                    {activity.type === 'communication' && <span className="text-xl">💬</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {activity.link ? (
                      <Link
                        href={activity.link}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {activity.title}
                      </Link>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.date).toLocaleDateString('no-NO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
