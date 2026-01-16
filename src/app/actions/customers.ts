/**
 * Mercatur CRM - Customer Server Actions
 *
 * Secure server-side operations for customer management.
 * Includes IDOR protection, input validation, and error sanitization.
 *
 * Reference: docs/security/idor-protection.md
 * Reference: docs/security/sql-injection-prevention.md
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from '@/lib/validations/customer';
import {
  sanitizeError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  type ErrorResponse,
} from '@/lib/utils/error-handler';
import type { Customer, CustomerWithStats } from '@/types/database';

/**
 * Standard success response
 */
interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Action response type
 */
type ActionResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Create a new customer
 *
 * @param input - Customer data (company_name, org_number, etc.)
 * @returns Created customer or error
 */
export async function createCustomer(
  input: Omit<CreateCustomerInput, 'created_by'>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // 2. Validate input (Zod)
    const validationResult = createCustomerSchema.safeParse({
      ...input,
      created_by: user.id,
    });

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    const validatedData = validationResult.data;

    // 3. Insert customer (auto-set created_by)
    const { data: customer, error: insertError } = await supabase
      .from('customers')
      .insert({
        company_name: validatedData.company_name,
        org_number: validatedData.org_number,
        industry: validatedData.industry,
        website: validatedData.website || null,
        address: validatedData.address,
        notes: validatedData.notes,
        lifecycle_stage: validatedData.lifecycle_stage,
        customer_status: validatedData.customer_status,
        lead_source: validatedData.lead_source,
        annual_revenue: validatedData.annual_revenue,
        next_contact_date: validatedData.next_contact_date,
        assigned_to: validatedData.assigned_to,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      return sanitizeError(insertError);
    }

    // 4. Revalidate cache
    revalidatePath('/customers');

    return { success: true, data: { id: customer.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Update an existing customer
 *
 * IDOR Protection: Only allows updating if user is creator OR assigned_to
 *
 * @param input - Customer data with id
 * @returns Updated customer or error
 */
export async function updateCustomer(
  input: UpdateCustomerInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // 2. Validate input
    const validationResult = updateCustomerSchema.safeParse(input);

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    const validatedData = validationResult.data;

    // 3. Check ownership BEFORE update (IDOR protection)
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id, created_by, assigned_to')
      .eq('id', validatedData.id)
      .single();

    if (fetchError) {
      return sanitizeError(fetchError);
    }

    if (!existingCustomer) {
      return notFoundError('Kunde');
    }

    // IDOR Check: User must be creator OR assigned_to
    const isOwner = existingCustomer.created_by === user.id;
    const isAssigned = existingCustomer.assigned_to === user.id;

    if (!isOwner && !isAssigned) {
      return forbiddenError();
    }

    // 4. Update customer
    const updateData: Record<string, unknown> = {};
    if (validatedData.company_name !== undefined) updateData.company_name = validatedData.company_name;
    if (validatedData.org_number !== undefined) updateData.org_number = validatedData.org_number;
    if (validatedData.industry !== undefined) updateData.industry = validatedData.industry;
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.lifecycle_stage !== undefined) updateData.lifecycle_stage = validatedData.lifecycle_stage;
    if (validatedData.customer_status !== undefined) updateData.customer_status = validatedData.customer_status;
    if (validatedData.lead_source !== undefined) updateData.lead_source = validatedData.lead_source;
    if (validatedData.annual_revenue !== undefined) updateData.annual_revenue = validatedData.annual_revenue;
    if (validatedData.next_contact_date !== undefined) updateData.next_contact_date = validatedData.next_contact_date;
    if (validatedData.assigned_to !== undefined) updateData.assigned_to = validatedData.assigned_to;

    const { error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', validatedData.id);

    if (updateError) {
      return sanitizeError(updateError);
    }

    // 5. Revalidate cache
    revalidatePath('/customers');
    revalidatePath(`/customers/${validatedData.id}`);

    return { success: true, data: { id: validatedData.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Delete a customer
 *
 * IDOR Protection: Only allows deleting if user is creator OR assigned_to
 *
 * @param customerId - Customer ID to delete
 * @returns Success or error
 */
export async function deleteCustomer(
  customerId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // 2. Validate customer ID
    const validationResult = customerIdSchema.safeParse({ id: customerId });

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    // 3. Check ownership BEFORE delete (IDOR protection)
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id, created_by, assigned_to')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      return sanitizeError(fetchError);
    }

    if (!existingCustomer) {
      return notFoundError('Kunde');
    }

    // IDOR Check: User must be creator OR assigned_to
    const isOwner = existingCustomer.created_by === user.id;
    const isAssigned = existingCustomer.assigned_to === user.id;

    if (!isOwner && !isAssigned) {
      return forbiddenError();
    }

    // 4. Delete customer (cascading deletes handled by database)
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (deleteError) {
      return sanitizeError(deleteError);
    }

    // 5. Revalidate cache
    revalidatePath('/customers');

    return { success: true, data: { id: customerId } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get a single customer by ID
 *
 * IDOR Protection: RLS policies ensure only accessible customers are returned
 *
 * @param customerId - Customer ID
 * @returns Customer data or error
 */
export async function getCustomer(customerId: string): Promise<ActionResponse<CustomerWithStats>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // 2. Validate customer ID
    const validationResult = customerIdSchema.safeParse({ id: customerId });

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    // 3. Fetch customer with stats (RLS policies enforce access control)
    const { data: customer, error: fetchError } = await supabase
      .from('customers_with_stats')
      .select('*')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      return sanitizeError(fetchError);
    }

    if (!customer) {
      return notFoundError('Kunde');
    }

    return { success: true, data: customer };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get all customers for current user
 *
 * IDOR Protection: RLS policies ensure only accessible customers are returned
 * Pagination: Limited to 50 customers per page
 *
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 50, max 100)
 * @returns Customers array or error
 */
export async function getCustomers(
  page: number = 1,
  limit: number = 50
): Promise<ActionResponse<{ customers: CustomerWithStats[]; total: number; page: number; totalPages: number }>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // 2. Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    // 3. Calculate offset
    const offset = (validPage - 1) * validLimit;

    // 4. Fetch customers with pagination (RLS policies enforce access control)
    const { data: customers, error: fetchError } = await supabase
      .from('customers_with_stats')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + validLimit - 1);

    if (fetchError) {
      return sanitizeError(fetchError);
    }

    // 5. Get total count (for pagination metadata)
    const { count, error: countError } = await supabase
      .from('customers_with_stats')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return sanitizeError(countError);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / validLimit);

    return {
      success: true,
      data: {
        customers: customers || [],
        total,
        page: validPage,
        totalPages,
      },
    };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Search customers
 *
 * IDOR Protection: RLS policies ensure only accessible customers are returned
 * Pagination: Limited to 50 results
 *
 * @param query - Search query
 * @param limit - Max results (default 50)
 * @returns Matching customers or error
 */
export async function searchCustomers(
  query: string,
  limit: number = 50
): Promise<ActionResponse<CustomerWithStats[]>> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // 2. Validate limit
    const validLimit = Math.min(100, Math.max(1, limit));

    // 3. Search customers (RLS policies enforce access control)
    const { data: customers, error: searchError } = await supabase
      .from('customers_with_stats')
      .select('*')
      .or(`company_name.ilike.%${query}%,org_number.ilike.%${query}%,email.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(validLimit);

    if (searchError) {
      return sanitizeError(searchError);
    }

    return { success: true, data: customers || [] };
  } catch (error) {
    return sanitizeError(error);
  }
}
