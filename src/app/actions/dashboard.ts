'use server';

/**
 * Dashboard Server Actions
 *
 * Provides statistics and data for the dashboard
 * Implements IDOR protection and proper error handling
 */

import { createClient } from '@/lib/supabase/server';
import { checkAuthAndEnsureProfile } from '@/lib/supabase/middleware-auth-check';
import { sanitizeError } from '@/lib/utils/error-handler';
import type { ActionResponse } from '@/types/actions';

/**
 * Dashboard Statistics Interface
 */
export interface DashboardStats {
  totalCustomers: number;
  totalContacts: number;
  activeDeals: number;
  activeDealValue: number;
  recentCommunications: number; // Last 7 days
  customersThisMonth: number;
}

/**
 * Get Dashboard Statistics
 *
 * Security: Only returns stats for data the authenticated user has access to
 * Uses RLS policies to ensure proper data isolation
 */
export async function getDashboardStats(): Promise<ActionResponse<DashboardStats>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const authCheck = await checkAuthAndEnsureProfile(supabase);
    if (!authCheck.authenticated || !authCheck.user) {
      return sanitizeError(new Error('Unauthorized'));
    }

    const userId = authCheck.user.id;

    // Run all queries in parallel for better performance
    const [
      customersResult,
      contactsResult,
      dealsResult,
      dealValueResult,
      recentCommsResult,
      customersThisMonthResult,
    ] = await Promise.all([
      // Total customers
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId),

      // Total contacts
      supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId),

      // Active deals (not won or lost)
      supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .neq('stage', 'won')
        .neq('stage', 'lost')
        .eq('assigned_to', userId),

      // Active deal value (sum of deal_value for active deals)
      supabase
        .from('deals')
        .select('deal_value')
        .neq('stage', 'won')
        .neq('stage', 'lost')
        .eq('assigned_to', userId),

      // Recent communications (last 7 days)
      supabase
        .from('communication_logs')
        .select('id', { count: 'exact', head: true })
        .eq('logged_by', userId)
        .gte('communication_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Customers created this month
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

    // Check for errors
    if (customersResult.error) {
      console.error('Error fetching customers count:', customersResult.error);
      return sanitizeError(customersResult.error);
    }

    if (contactsResult.error) {
      console.error('Error fetching contacts count:', contactsResult.error);
      return sanitizeError(contactsResult.error);
    }

    if (dealsResult.error) {
      console.error('Error fetching deals count:', dealsResult.error);
      return sanitizeError(dealsResult.error);
    }

    if (dealValueResult.error) {
      console.error('Error fetching deal value:', dealValueResult.error);
      return sanitizeError(dealValueResult.error);
    }

    if (recentCommsResult.error) {
      console.error('Error fetching communications count:', recentCommsResult.error);
      return sanitizeError(recentCommsResult.error);
    }

    if (customersThisMonthResult.error) {
      console.error('Error fetching customers this month:', customersThisMonthResult.error);
      return sanitizeError(customersThisMonthResult.error);
    }

    // Calculate total deal value
    const activeDealValue = dealValueResult.data?.reduce(
      (sum, deal) => sum + (deal.deal_value || 0),
      0
    ) || 0;

    const stats: DashboardStats = {
      totalCustomers: customersResult.count || 0,
      totalContacts: contactsResult.count || 0,
      activeDeals: dealsResult.count || 0,
      activeDealValue,
      recentCommunications: recentCommsResult.count || 0,
      customersThisMonth: customersThisMonthResult.count || 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return sanitizeError(error);
  }
}

/**
 * Recent Activity Interface
 */
export interface RecentActivity {
  id: string;
  type: 'customer' | 'contact' | 'deal' | 'communication';
  title: string;
  description: string;
  date: string;
  link?: string;
}

/**
 * Get Recent Activity
 *
 * Returns the 10 most recent activities across all entities
 * Security: Only returns activities for data the user has access to
 */
export async function getRecentActivity(): Promise<ActionResponse<RecentActivity[]>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const authCheck = await checkAuthAndEnsureProfile(supabase);
    if (!authCheck.authenticated || !authCheck.user) {
      return sanitizeError(new Error('Unauthorized'));
    }

    const userId = authCheck.user.id;

    // Fetch recent items from each table
    const [customersResult, contactsResult, dealsResult, commsResult] = await Promise.all([
      // Recent customers (last 5)
      supabase
        .from('customers')
        .select('id, company_name, created_at')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent contacts (last 5)
      supabase
        .from('contacts')
        .select('id, full_name, customer_id, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent deals (last 5)
      supabase
        .from('deals')
        .select('id, deal_name, customer_id, created_at')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent communications (last 5)
      supabase
        .from('communication_logs')
        .select('id, subject, customer_id, communication_date')
        .eq('logged_by', userId)
        .order('communication_date', { ascending: false })
        .limit(5),
    ]);

    // Combine and sort all activities
    const activities: RecentActivity[] = [];

    // Add customers
    if (customersResult.data) {
      customersResult.data.forEach((customer) => {
        activities.push({
          id: customer.id,
          type: 'customer',
          title: customer.company_name,
          description: 'Ny kunde opprettet',
          date: customer.created_at,
          link: `/customers/${customer.id}`,
        });
      });
    }

    // Add contacts
    if (contactsResult.data) {
      contactsResult.data.forEach((contact) => {
        activities.push({
          id: contact.id,
          type: 'contact',
          title: contact.full_name,
          description: 'Ny kontakt opprettet',
          date: contact.created_at,
          link: `/customers/${contact.customer_id}/contacts/${contact.id}`,
        });
      });
    }

    // Add deals
    if (dealsResult.data) {
      dealsResult.data.forEach((deal) => {
        activities.push({
          id: deal.id,
          type: 'deal',
          title: deal.deal_name,
          description: 'Ny deal opprettet',
          date: deal.created_at,
          link: `/deals/${deal.id}`,
        });
      });
    }

    // Add communications
    if (commsResult.data) {
      commsResult.data.forEach((comm) => {
        activities.push({
          id: comm.id,
          type: 'communication',
          title: comm.subject || 'Kommunikasjon',
          description: 'Ny hendelse logget',
          date: comm.communication_date,
          link: `/customers/${comm.customer_id}`,
        });
      });
    }

    // Sort by date (newest first) and take top 10
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentActivities = activities.slice(0, 10);

    return { success: true, data: recentActivities };
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    return sanitizeError(error);
  }
}
