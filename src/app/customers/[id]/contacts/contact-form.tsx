'use client';

/**
 * Contact Form Component
 *
 * Reusable form for creating and editing contacts
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createContact, updateContact } from '@/app/actions/contacts';

interface ContactFormProps {
  mode: 'create' | 'edit';
  customerId: string;
  userId: string;
  contact?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    linkedin_url: string | null;
    department: string | null;
    is_decision_maker: boolean;
    is_primary: boolean;
    notes: string | null;
  };
}

export function ContactForm({ mode, customerId, userId, contact }: ContactFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: contact?.full_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    job_title: contact?.job_title || '',
    linkedin_url: contact?.linkedin_url || '',
    department: contact?.department || '',
    is_decision_maker: contact?.is_decision_maker || false,
    is_primary: contact?.is_primary || false,
    notes: contact?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Prepare data
      const contactData = {
        customer_id: customerId,
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim() || '',
        job_title: formData.job_title.trim() || '',
        linkedin_url: formData.linkedin_url.trim() || '',
        department: formData.department.trim() || '',
        is_decision_maker: formData.is_decision_maker,
        is_primary: formData.is_primary,
        notes: formData.notes.trim() || '',
      };

      if (mode === 'create') {
        const result = await createContact(contactData);

        if ('error' in result) {
          setError(result.error);
          return;
        }

        router.push(`/customers/${customerId}/contacts`);
        router.refresh();
      } else {
        const result = await updateContact({
          id: contact!.id,
          ...contactData,
          updated_by: userId,
        });

        if ('error' in result) {
          setError(result.error);
          return;
        }

        router.push(`/customers/${customerId}/contacts/${contact!.id}`);
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

      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Fullt navn <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="full_name"
          id="full_name"
          required
          value={formData.full_name}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-postadresse
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Telefonnummer
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Job Title */}
      <div>
        <label htmlFor="job_title" className="block text-sm font-medium text-gray-700">
          Stillingstittel
        </label>
        <input
          type="text"
          name="job_title"
          id="job_title"
          value={formData.job_title}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Department */}
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
          Avdeling
        </label>
        <input
          type="text"
          name="department"
          id="department"
          value={formData.department}
          onChange={handleChange}
          placeholder="IT, Markedsføring, Ledelse, etc."
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* LinkedIn URL */}
      <div>
        <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700">
          LinkedIn profil
        </label>
        <input
          type="url"
          name="linkedin_url"
          id="linkedin_url"
          value={formData.linkedin_url}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/..."
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_primary"
            id="is_primary"
            checked={formData.is_primary}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
            Primærkontakt
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_decision_maker"
            id="is_decision_maker"
            checked={formData.is_decision_maker}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_decision_maker" className="ml-2 block text-sm text-gray-900">
            Beslutningstaker
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notater
        </label>
        <textarea
          name="notes"
          id="notes"
          rows={4}
          value={formData.notes}
          onChange={handleChange}
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
          {loading ? 'Lagrer...' : mode === 'create' ? 'Opprett kontakt' : 'Lagre endringer'}
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
