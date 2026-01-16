'use server';

/**
 * Global Search Server Actions
 *
 * Search across customers, contacts, communications, and deals
 */

import { createClient } from '@/lib/supabase/server';
import { sanitizeError } from '@/lib/utils/error-handler';
import type { ActionResponse } from '@/types/actions';

export interface SearchResult {
  type: 'customer' | 'contact' | 'communication' | 'deal';
  id: string;
  title: string;
  description: string;
  link: string;
  metadata?: string;
}

/**
 * Global search across all entities
 *
 * Security: Only searches data user has access to
 */
export async function globalSearch(query: string): Promise<ActionResponse<SearchResult[]>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return sanitizeError(new Error('Unauthorized'));

    // Validate query
    const searchQuery = query.trim();
    if (searchQuery.length < 2) {
      return { success: true, data: [] };
    }

    const results: SearchResult[] = [];

    // Search customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, company_name, org_number, industry')
      .eq('assigned_to', user.id)
      .or(`company_name.ilike.%${searchQuery}%,org_number.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%`)
      .limit(10);

    if (customers) {
      customers.forEach(c => {
        results.push({
          type: 'customer',
          id: c.id,
          title: c.company_name,
          description: 'Kunde',
          link: `/customers/${c.id}`,
          metadata: c.org_number || c.industry || ''
        });
      });
    }

    // Search contacts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, full_name, job_title, email, customer_id')
      .eq('created_by', user.id)
      .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,job_title.ilike.%${searchQuery}%`)
      .limit(10);

    if (contacts) {
      contacts.forEach(c => {
        results.push({
          type: 'contact',
          id: c.id,
          title: c.full_name,
          description: 'Kontaktperson',
          link: `/customers/${c.customer_id}/contacts/${c.id}`,
          metadata: c.job_title || c.email || ''
        });
      });
    }

    // Search communications
    const { data: communications } = await supabase
      .from('communication_logs')
      .select('id, subject, communication_type, customer_id')
      .eq('logged_by', user.id)
      .ilike('subject', `%${searchQuery}%`)
      .limit(10);

    if (communications) {
      communications.forEach(c => {
        results.push({
          type: 'communication',
          id: c.id,
          title: c.subject,
          description: 'Kommunikasjon',
          link: `/customers/${c.customer_id}/communications/${c.id}`,
          metadata: c.communication_type
        });
      });
    }

    // Search deals
    const { data: deals } = await supabase
      .from('deals')
      .select('id, deal_name, deal_value, currency, stage')
      .eq('assigned_to', user.id)
      .ilike('deal_name', `%${searchQuery}%`)
      .limit(10);

    if (deals) {
      deals.forEach(d => {
        results.push({
          type: 'deal',
          id: d.id,
          title: d.deal_name,
          description: 'Deal',
          link: `/deals/${d.id}`,
          metadata: `${d.deal_value.toLocaleString('no-NO')} ${d.currency} - ${d.stage}`
        });
      });
    }

    return { success: true, data: results };
  } catch (error) {
    return sanitizeError(error);
  }
}
