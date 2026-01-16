'use client';

/**
 * Communication Form Component
 *
 * Reusable form for creating and editing communication logs
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCommunication, updateCommunication } from '@/app/actions/communications';
import type { Contact } from '@/types/database';

interface CommunicationFormProps {
  mode: 'create' | 'edit';
  customerId: string;
  userId: string;
  contacts: Contact[]; // List of contacts for the customer
  communication?: {
    id: string;
    communication_type: 'meeting' | 'email' | 'phone' | 'other';
    communication_date: string;
    subject: string;
    description: string | null;
    contact_id: string | null;
  };
}

export function CommunicationForm({ mode, customerId, userId, contacts, communication }: CommunicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    communication_type: communication?.communication_type || 'meeting',
    communication_date: communication?.communication_date
      ? new Date(communication.communication_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    subject: communication?.subject || '',
    description: communication?.description || '',
    contact_id: communication?.contact_id || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Convert local datetime to ISO string
      const communicationDate = new Date(formData.communication_date).toISOString();

      // Prepare data
      const commData = {
        customer_id: customerId,
        contact_id: formData.contact_id || null,
        communication_type: formData.communication_type as 'meeting' | 'email' | 'phone' | 'other',
        communication_date: communicationDate,
        subject: formData.subject.trim(),
        description: formData.description.trim() || '',
      };

      if (mode === 'create') {
        const result = await createCommunication(commData);

        if ('error' in result) {
          setError(result.error);
          return;
        }

        router.push(`/customers/${customerId}/communications`);
        router.refresh();
      } else {
        const result = await updateCommunication({
          id: communication!.id,
          ...commData,
          updated_by: userId,
        });

        if ('error' in result) {
          setError(result.error);
          return;
        }

        router.push(`/customers/${customerId}/communications/${communication!.id}`);
        router.refresh();
      }
    } catch (err) {
      setError('En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Communication Type */}
      <div>
        <label htmlFor="communication_type" className="block text-sm font-medium text-gray-700">
          Type hendelse <span className="text-red-500">*</span>
        </label>
        <select
          name="communication_type"
          id="communication_type"
          required
          value={formData.communication_type}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="meeting">Møte</option>
          <option value="email">E-post</option>
          <option value="phone">Telefon</option>
          <option value="other">Annet</option>
        </select>
      </div>

      {/* Communication Date */}
      <div>
        <label htmlFor="communication_date" className="block text-sm font-medium text-gray-700">
          Dato og tid <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          name="communication_date"
          id="communication_date"
          required
          value={formData.communication_date}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Emne <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="subject"
          id="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          placeholder="F.eks. 'Oppfølgingsmøte om prosjekt X'"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Contact */}
      {contacts.length > 0 && (
        <div>
          <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
            Kontaktperson (valgfritt)
          </label>
          <select
            name="contact_id"
            id="contact_id"
            value={formData.contact_id}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Ingen spesifikk kontakt</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.full_name} {contact.job_title ? `(${contact.job_title})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Beskrivelse
        </label>
        <textarea
          name="description"
          id="description"
          rows={6}
          value={formData.description}
          onChange={handleChange}
          placeholder="Detaljer om kommunikasjonen, viktige punkter, neste steg, etc."
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Lagrer...' : mode === 'create' ? 'Logg hendelse' : 'Lagre endringer'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
