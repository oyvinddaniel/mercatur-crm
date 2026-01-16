'use server';

/**
 * Communication Log Server Actions
 *
 * Secure server-side operations for communication log management
 * Includes IDOR protection, input validation, and error sanitization
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createCommunicationSchema,
  updateCommunicationSchema,
  communicationIdSchema,
  type CreateCommunicationInput,
  type UpdateCommunicationInput,
} from '@/lib/validations/communication';
import { sanitizeError } from '@/lib/utils/error-handler';
import type { CommunicationLog } from '@/types/database';
import type { ActionResponse } from '@/types/actions';

/**
 * Create a new communication log
 *
 * Security: Validates user owns the customer before creating
 */
export async function createCommunication(
  input: Omit<CreateCommunicationInput, 'logged_by'>
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
    const validatedData = createCommunicationSchema.parse(input);

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

    // 4. If contact_id is provided, verify it belongs to the customer
    if (validatedData.contact_id) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', validatedData.contact_id)
        .eq('customer_id', validatedData.customer_id)
        .single();

      if (contactError || !contact) {
        return sanitizeError(new Error('Invalid contact for this customer'));
      }
    }

    // 5. Insert communication log
    const { data: communication, error: insertError } = await supabase
      .from('communication_logs')
      .insert({
        ...validatedData,
        logged_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating communication log:', insertError);
      return sanitizeError(insertError);
    }

    // 6. Revalidate relevant pages
    revalidatePath(`/customers/${validatedData.customer_id}`);
    revalidatePath('/dashboard');

    return { success: true, data: { id: communication.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Update an existing communication log
 *
 * Security: Validates user logged the original communication
 */
export async function updateCommunication(
  input: UpdateCommunicationInput
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
    const validatedData = updateCommunicationSchema.parse(input);

    // 3. IDOR Protection: Verify user logged the original communication
    const { data: existingComm, error: fetchError } = await supabase
      .from('communication_logs')
      .select('id, customer_id')
      .eq('id', validatedData.id)
      .eq('logged_by', user.id)
      .single();

    if (fetchError || !existingComm) {
      return sanitizeError(new Error('Forbidden'));
    }

    // 4. Verify user still owns the customer (customer might have been reassigned)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', validatedData.customer_id)
      .eq('assigned_to', user.id)
      .single();

    if (customerError || !customer) {
      return sanitizeError(new Error('Forbidden'));
    }

    // 5. If contact_id is provided, verify it belongs to the customer
    if (validatedData.contact_id) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', validatedData.contact_id)
        .eq('customer_id', validatedData.customer_id)
        .single();

      if (contactError || !contact) {
        return sanitizeError(new Error('Invalid contact for this customer'));
      }
    }

    // 6. Update communication log
    const { error: updateError } = await supabase
      .from('communication_logs')
      .update({
        customer_id: validatedData.customer_id,
        contact_id: validatedData.contact_id,
        communication_type: validatedData.communication_type,
        communication_date: validatedData.communication_date,
        subject: validatedData.subject,
        description: validatedData.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.id);

    if (updateError) {
      console.error('Error updating communication log:', updateError);
      return sanitizeError(updateError);
    }

    // 7. Revalidate relevant pages
    revalidatePath(`/customers/${validatedData.customer_id}`);
    revalidatePath(`/customers/${existingComm.customer_id}`); // Old customer if changed
    revalidatePath('/dashboard');

    return { success: true, data: { id: validatedData.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Delete a communication log
 *
 * Security: Validates user logged the original communication
 */
export async function deleteCommunication(
  communicationId: string
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
    const validatedData = communicationIdSchema.parse({ id: communicationId });

    // 3. IDOR Protection: Verify user logged the communication
    const { data: existingComm, error: fetchError } = await supabase
      .from('communication_logs')
      .select('id, customer_id')
      .eq('id', validatedData.id)
      .eq('logged_by', user.id)
      .single();

    if (fetchError || !existingComm) {
      return sanitizeError(new Error('Forbidden'));
    }

    // 4. Delete communication log
    const { error: deleteError } = await supabase
      .from('communication_logs')
      .delete()
      .eq('id', validatedData.id);

    if (deleteError) {
      console.error('Error deleting communication log:', deleteError);
      return sanitizeError(deleteError);
    }

    // 5. Revalidate relevant pages
    revalidatePath(`/customers/${existingComm.customer_id}`);
    revalidatePath('/dashboard');

    return { success: true, data: { id: validatedData.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get a single communication log by ID
 *
 * Security: Only returns if user logged the communication
 */
export async function getCommunication(
  communicationId: string
): Promise<ActionResponse<CommunicationLog>> {
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
    const validatedData = communicationIdSchema.parse({ id: communicationId });

    // 3. Fetch communication with IDOR protection
    const { data: communication, error: fetchError } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('id', validatedData.id)
      .eq('logged_by', user.id)
      .single();

    if (fetchError || !communication) {
      return sanitizeError(new Error('Not found'));
    }

    return { success: true, data: communication };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get all communication logs for a customer
 *
 * Security: Only returns communications for customers assigned to user
 */
export async function getCommunicationsForCustomer(
  customerId: string
): Promise<ActionResponse<CommunicationLog[]>> {
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

    // 3. Fetch communications for customer
    const { data: communications, error: fetchError } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('customer_id', customerId)
      .order('communication_date', { ascending: false })
      .limit(100); // Pagination limit

    if (fetchError) {
      console.error('Error fetching communications:', fetchError);
      return sanitizeError(fetchError);
    }

    return { success: true, data: communications || [] };
  } catch (error) {
    return sanitizeError(error);
  }
}
