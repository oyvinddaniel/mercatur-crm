'use client';

/**
 * Customer Form Component
 *
 * Reusable form for creating and editing customers
 * Uses secure Server Actions with IDOR protection
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomer, updateCustomer } from '@/app/actions/customers';

interface CustomerFormProps {
  mode: 'create' | 'edit';
  userId: string;
  customer?: {
    id: string;
    company_name: string;
    org_number: string | null;
    address: string | null;
    industry: string | null;
    website: string | null;
    notes: string | null;
    lifecycle_stage: string | null;
    customer_status: string | null;
    lead_source: string | null;
    annual_revenue: number | null;
    next_contact_date: string | null;
  };
}

export function CustomerForm({ mode, userId, customer }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    company_name: customer?.company_name || '',
    org_number: customer?.org_number || '',
    address: customer?.address || '',
    industry: customer?.industry || '',
    website: customer?.website || '',
    notes: customer?.notes || '',
    lifecycle_stage: customer?.lifecycle_stage || 'lead',
    customer_status: customer?.customer_status || 'potential',
    lead_source: customer?.lead_source || '',
    annual_revenue: customer?.annual_revenue?.toString() || '',
    next_contact_date: customer?.next_contact_date || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Prepare data for Server Action
      const customerData = {
        company_name: formData.company_name.trim(),
        org_number: formData.org_number.trim() || null,
        address: formData.address.trim() || null,
        industry: formData.industry.trim() || null,
        website: formData.website.trim() || null,
        notes: formData.notes.trim() || null,
        lifecycle_stage: formData.lifecycle_stage as 'lead' | 'prospect' | 'customer' | 'active' | 'former' | null,
        customer_status: formData.customer_status as 'active' | 'inactive' | 'potential' | 'lost' | null,
        lead_source: formData.lead_source.trim() || null,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
        next_contact_date: formData.next_contact_date || null,
      };

      if (mode === 'create') {
        // Call secure Server Action with IDOR protection
        const result = await createCustomer(customerData);

        if ('error' in result) {
          setError(result.error);
          return;
        }

        router.push('/customers?message=Kunde opprettet');
        router.refresh();
      } else {
        // Call secure Server Action with ownership verification
        const result = await updateCustomer({
          id: customer!.id,
          ...customerData,
        });

        if ('error' in result) {
          setError(result.error);
          return;
        }

        router.push(`/customers/${customer!.id}?message=Kunde oppdatert`);
        router.refresh();
      }
    } catch (err) {
      console.error('Error saving customer:', err);
      setError('En uventet feil oppstod. Vennligst prøv igjen.');
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

      {/* Company Name - Required */}
      <div>
        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
          Firmanavn <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          required
          value={formData.company_name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Org Number */}
      <div>
        <label htmlFor="org_number" className="block text-sm font-medium text-gray-700 mb-1">
          Organisasjonsnummer
        </label>
        <input
          type="text"
          id="org_number"
          name="org_number"
          value={formData.org_number}
          onChange={handleChange}
          placeholder="123456789"
          pattern="\d{9}"
          title="9 siffer"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Industry */}
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
          Bransje
        </label>
        <input
          type="text"
          id="industry"
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Adresse
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
          Nettside
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lifecycle Stage & Customer Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="lifecycle_stage" className="block text-sm font-medium text-gray-700 mb-1">
            Livssyklusfase
          </label>
          <select
            id="lifecycle_stage"
            name="lifecycle_stage"
            value={formData.lifecycle_stage}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="lead">Lead</option>
            <option value="prospect">Prospekt</option>
            <option value="customer">Kunde</option>
            <option value="active">Aktiv</option>
            <option value="former">Tidligere</option>
          </select>
        </div>

        <div>
          <label htmlFor="customer_status" className="block text-sm font-medium text-gray-700 mb-1">
            Kundestatus
          </label>
          <select
            id="customer_status"
            name="customer_status"
            value={formData.customer_status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="potential">Potensiell</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
            <option value="lost">Tapt</option>
          </select>
        </div>
      </div>

      {/* Lead Source */}
      <div>
        <label htmlFor="lead_source" className="block text-sm font-medium text-gray-700 mb-1">
          Lead-kilde
        </label>
        <input
          type="text"
          id="lead_source"
          name="lead_source"
          value={formData.lead_source}
          onChange={handleChange}
          placeholder="Nettsiden, henvisning, messer, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Annual Revenue */}
      <div>
        <label htmlFor="annual_revenue" className="block text-sm font-medium text-gray-700 mb-1">
          Årlig omsetning (NOK)
        </label>
        <input
          type="number"
          id="annual_revenue"
          name="annual_revenue"
          value={formData.annual_revenue}
          onChange={handleChange}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Next Contact Date */}
      <div>
        <label htmlFor="next_contact_date" className="block text-sm font-medium text-gray-700 mb-1">
          Neste kontaktdato
        </label>
        <input
          type="date"
          id="next_contact_date"
          name="next_contact_date"
          value={formData.next_contact_date}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notater
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Lagrer...' : mode === 'create' ? 'Opprett kunde' : 'Lagre endringer'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
