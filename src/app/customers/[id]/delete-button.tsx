'use client';

/**
 * Delete Customer Button
 *
 * Handles customer deletion with confirmation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (deleteError) throw deleteError;

      router.push('/customers?message=Kunde slettet');
      router.refresh();
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke slette kunde');
    } finally {
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
      >
        Slett
      </button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      {error && <span className="text-sm text-red-600">{error}</span>}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Sletter...' : 'Bekreft sletting'}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        disabled={loading}
        className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
      >
        Avbryt
      </button>
    </div>
  );
}
