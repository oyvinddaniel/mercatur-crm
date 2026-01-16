'use client';

/**
 * Delete Communication Button Component
 *
 * Client component for deleting communication logs with confirmation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCommunication } from '@/app/actions/communications';

interface DeleteCommunicationButtonProps {
  communicationId: string;
  customerId: string;
}

export function DeleteCommunicationButton({ communicationId, customerId }: DeleteCommunicationButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Er du sikker på at du vil slette denne kommunikasjonshendelsen?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteCommunication(communicationId);

      if ('error' in result) {
        alert(`Kunne ikke slette: ${result.error}`);
        return;
      }

      router.push(`/customers/${customerId}/communications`);
      router.refresh();
    } catch (error) {
      alert('En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
    >
      {loading ? 'Sletter...' : 'Slett'}
    </button>
  );
}
