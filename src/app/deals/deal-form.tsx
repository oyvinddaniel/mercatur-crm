'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDeal, updateDeal } from '@/app/actions/deals';

interface DealFormProps {
  mode: 'create' | 'edit';
  userId: string;
  deal?: {
    id: string;
    customer_id: string;
    deal_name: string;
    deal_value: number;
    currency: string;
    stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
    probability: number;
    expected_close_date: string | null;
    actual_close_date: string | null;
    notes: string | null;
  };
  customers?: Array<{ id: string; company_name: string }>; // For create mode
}

export function DealForm({ mode, userId, deal, customers }: DealFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_id: deal?.customer_id || (customers?.[0]?.id || ''),
    deal_name: deal?.deal_name || '',
    deal_value: deal?.deal_value.toString() || '0',
    currency: deal?.currency || 'NOK',
    stage: deal?.stage || 'lead',
    probability: deal?.probability.toString() || '50',
    expected_close_date: deal?.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
    actual_close_date: deal?.actual_close_date ? deal.actual_close_date.split('T')[0] : '',
    notes: deal?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const dealData = {
        customer_id: formData.customer_id,
        deal_name: formData.deal_name.trim(),
        deal_value: parseFloat(formData.deal_value),
        currency: formData.currency,
        stage: formData.stage as 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost',
        probability: parseInt(formData.probability),
        expected_close_date: formData.expected_close_date || '',
        actual_close_date: formData.actual_close_date || '',
        notes: formData.notes.trim() || '',
      };

      if (mode === 'create') {
        const result = await createDeal(dealData);
        if ('error' in result) {
          setError(result.error);
          return;
        }
        router.push('/deals');
        router.refresh();
      } else {
        const result = await updateDeal({ id: deal!.id, ...dealData, updated_by: userId });
        if ('error' in result) {
          setError(result.error);
          return;
        }
        router.push(`/deals/${deal!.id}`);
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
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {mode === 'create' && customers && (
        <div>
          <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">Kunde <span className="text-red-500">*</span></label>
          <select name="customer_id" id="customer_id" required value={formData.customer_id} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="deal_name" className="block text-sm font-medium text-gray-700">Deal-navn <span className="text-red-500">*</span></label>
        <input type="text" name="deal_name" id="deal_name" required value={formData.deal_name} onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="deal_value" className="block text-sm font-medium text-gray-700">Verdi <span className="text-red-500">*</span></label>
          <input type="number" name="deal_value" id="deal_value" required value={formData.deal_value} onChange={handleChange} min="0" step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Valuta</label>
          <input type="text" name="currency" id="currency" value={formData.currency} onChange={handleChange} maxLength={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
          <select name="stage" id="stage" required value={formData.stage} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <option value="lead">Lead</option>
            <option value="qualified">Kvalifisert</option>
            <option value="proposal">Tilbud</option>
            <option value="negotiation">Forhandling</option>
            <option value="won">Vunnet</option>
            <option value="lost">Tapt</option>
          </select>
        </div>
        <div>
          <label htmlFor="probability" className="block text-sm font-medium text-gray-700">Sannsynlighet (%)</label>
          <input type="number" name="probability" id="probability" value={formData.probability} onChange={handleChange} min="0" max="100"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expected_close_date" className="block text-sm font-medium text-gray-700">Forventet avslutning</label>
          <input type="date" name="expected_close_date" id="expected_close_date" value={formData.expected_close_date} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="actual_close_date" className="block text-sm font-medium text-gray-700">Faktisk avslutning</label>
          <input type="date" name="actual_close_date" id="actual_close_date" value={formData.actual_close_date} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notater</label>
        <textarea name="notes" id="notes" rows={4} value={formData.notes} onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Lagrer...' : mode === 'create' ? 'Opprett deal' : 'Lagre endringer'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300">
          Avbryt
        </button>
      </div>
    </form>
  );
}
