'use server';

/**
 * Deal Server Actions
 *
 * Secure server-side operations for deal management
 * Includes IDOR protection, input validation, and error sanitization
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createDealSchema,
  updateDealSchema,
  dealIdSchema,
  type CreateDealInput,
  type UpdateDealInput,
} from '@/lib/validations/deal';
import { sanitizeError } from '@/lib/utils/error-handler';
import type { Deal } from '@/types/database';
import type { ActionResponse } from '@/types/actions';

/**
 * Create a new deal
 *
 * Security: Validates user owns the customer before creating
 */
export async function createDeal(
  input: Omit<CreateDealInput, 'assigned_to'>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return sanitizeError(new Error('Unauthorized'));
    }

    // 2. Validate input
    const validatedData = createDealSchema.parse(input);

    // 3. IDOR Protection: Verify user owns the customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', validatedData.customer_id)
      .eq('assigned_to', user.id)
      .single();

    if (customerError || !customer) {
      return sanitizeError(new Error('Forbidden'));
    }

    // 4. Insert deal
    const { data: deal, error: insertError } = await supabase
      .from('deals')
      .insert({
        ...validatedData,
        assigned_to: user.id,
        expected_close_date: validatedData.expected_close_date || null,
        actual_close_date: validatedData.actual_close_date || null,
        notes: validatedData.notes || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating deal:', insertError);
      return sanitizeError(insertError);
    }

    // 5. Revalidate relevant pages
    revalidatePath(`/customers/${validatedData.customer_id}`);
    revalidatePath('/dashboard');

    return { success: true, data: { id: deal.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Update an existing deal
 *
 * Security: Validates user owns the deal
 */
export async function updateDeal(
  input: UpdateDealInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return sanitizeError(new Error('Unauthorized'));
    }

    // 2. Validate input
    const validatedData = updateDealSchema.parse(input);

    // 3. IDOR Protection: Verify user owns the deal
    const { data: existingDeal, error: fetchError } = await supabase
      .from('deals')
      .select('id, customer_id')
      .eq('id', validatedData.id)
      .eq('assigned_to', user.id)
      .single();

    if (fetchError || !existingDeal) {
      return sanitizeError(new Error('Forbidden'));
    }

    // 4. Verify user still owns the customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', validatedData.customer_id)
      .eq('assigned_to', user.id)
      .single();

    if (customerError || !customer) {
      return sanitizeError(new Error('Forbidden'));
    }

    // 5. Update deal
    const { error: updateError } = await supabase
      .from('deals')
      .update({
        customer_id: validatedData.customer_id,
        deal_name: validatedData.deal_name,
        deal_value: validatedData.deal_value,
        currency: validatedData.currency,
        stage: validatedData.stage,
        probability: validatedData.probability,
        expected_close_date: validatedData.expected_close_date || null,
        actual_close_date: validatedData.actual_close_date || null,
        notes: validatedData.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.id);

    if (updateError) {
      console.error('Error updating deal:', updateError);
      return sanitizeError(updateError);
    }

    // 6. Revalidate relevant pages
    revalidatePath(`/customers/${validatedData.customer_id}`);
    revalidatePath(`/customers/${existingDeal.customer_id}`); // Old customer if changed
    revalidatePath('/dashboard');

    return { success: true, data: { id: validatedData.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Delete a deal
 *
 * Security: Validates user owns the deal
 */
export async function deleteDeal(
  dealId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return sanitizeError(new Error('Unauthorized'));
    }

    // 2. Validate input
    const validatedData = dealIdSchema.parse({ id: dealId });

    // 3. IDOR Protection: Verify user owns the deal
    const { data: existingDeal, error: fetchError } = await supabase
      .from('deals')
      .select('id, customer_id')
      .eq('id', validatedData.id)
      .eq('assigned_to', user.id)
      .single();

    if (fetchError || !existingDeal) {
      return sanitizeError(new Error('Forbidden'));
    }

    // 4. Delete deal
    const { error: deleteError } = await supabase
      .from('deals')
      .delete()
      .eq('id', validatedData.id);

    if (deleteError) {
      console.error('Error deleting deal:', deleteError);
      return sanitizeError(deleteError);
    }

    // 5. Revalidate relevant pages
    revalidatePath(`/customers/${existingDeal.customer_id}`);
    revalidatePath('/dashboard');

    return { success: true, data: { id: validatedData.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get a single deal by ID
 *
 * Security: Only returns if user owns the deal
 */
export async function getDeal(
  dealId: string
): Promise<ActionResponse<Deal>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return sanitizeError(new Error('Unauthorized'));
    }

    // 2. Validate input
    const validatedData = dealIdSchema.parse({ id: dealId });

    // 3. Fetch deal with IDOR protection
    const { data: deal, error: fetchError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', validatedData.id)
      .eq('assigned_to', user.id)
      .single();

    if (fetchError || !deal) {
      return sanitizeError(new Error('Not found'));
    }

    return { success: true, data: deal };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get all deals for a customer
 *
 * Security: Only returns deals for customers assigned to user
 */
export async function getDealsForCustomer(
  customerId: string
): Promise<ActionResponse<Deal[]>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return sanitizeError(new Error('Unauthorized'));
    }

    // 2. IDOR Protection: Verify user owns the customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('assigned_to', user.id)
      .single();

    if (customerError || !customer) {
      return sanitizeError(new Error('Forbidden'));
    }

    // 3. Fetch deals for customer
    const { data: deals, error: fetchError } = await supabase
      .from('deals')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(100); // Pagination limit

    if (fetchError) {
      console.error('Error fetching deals:', fetchError);
      return sanitizeError(fetchError);
    }

    return { success: true, data: deals || [] };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get all deals for the authenticated user
 *
 * Security: Only returns deals assigned to user
 */
export async function getAllDeals(): Promise<ActionResponse<Deal[]>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return sanitizeError(new Error('Unauthorized'));
    }

    // 2. Fetch all deals for user
    const { data: deals, error: fetchError } = await supabase
      .from('deals')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
      .limit(100); // Pagination limit

    if (fetchError) {
      console.error('Error fetching deals:', fetchError);
      return sanitizeError(fetchError);
    }

    return { success: true, data: deals || [] };
  } catch (error) {
    return sanitizeError(error);
  }
}
