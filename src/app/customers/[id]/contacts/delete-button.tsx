'use client';

/**
 * Delete Contact Button Component
 *
 * Client component for deleting a contact with confirmation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteContact } from '@/app/actions/contacts';

interface DeleteContactButtonProps {
  contactId: string;
  customerId: string;
}

export function DeleteContactButton({ contactId, customerId }: DeleteContactButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('Er du sikker på at du vil slette denne kontakten?')) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await deleteContact(contactId);

      if ('error' in result) {
        setError(result.error);
        return;
      }

      router.push(`/customers/${customerId}/contacts`);
      router.refresh();
    } catch (err) {
      setError('En feil oppstod ved sletting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {loading ? 'Sletter...' : 'Slett'}
      </button>
      {error && (
        <div className="mt-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
