import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard');
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">Mercatur CRM</h1>
        <p className="text-xl text-gray-600 mb-8">
          Internt CRM-system for kundehåndtering og salgsstyring
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Logg inn
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Opprett konto
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold mb-2">Kundehåndtering</h3>
            <p className="text-sm text-gray-600">
              Hold oversikt over alle kunder og kontaktpersoner
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">💼</div>
            <h3 className="font-semibold mb-2">Salgspipeline</h3>
            <p className="text-sm text-gray-600">
              Følg opp muligheter fra lead til avsluttet salg
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold mb-2">Kommunikasjonslogg</h3>
            <p className="text-sm text-gray-600">
              Logg og spor all kommunikasjon med kundene
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
