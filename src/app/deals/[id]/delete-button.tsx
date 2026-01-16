'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDeal } from '@/app/actions/deals';

export function DeleteDealButton({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Er du sikker på at du vil slette denne dealen?')) return;
    setLoading(true);
    try {
      const result = await deleteDeal(dealId);
      if ('error' in result) {
        alert(`Kunne ikke slette: ${result.error}`);
        return;
      }
      router.push('/deals');
      router.refresh();
    } catch (error) {
      alert('En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}
      className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
      {loading ? 'Sletter...' : 'Slett'}
    </button>
  );
}
