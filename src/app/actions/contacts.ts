/**
 * Mercatur CRM - Contact Server Actions
 *
 * Secure server-side operations for contact management.
 * Includes input validation, error sanitization, and RLS protection.
 *
 * Reference: docs/security/idor-protection.md
 * Reference: docs/krav/datamodell.md (Section 3: contacts)
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createContactSchema,
  updateContactSchema,
  contactIdSchema,
  customerIdForContactsSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from '@/lib/validations/contact';
import {
  sanitizeError,
  unauthorizedError,
  notFoundError,
  type ErrorResponse,
} from '@/lib/utils/error-handler';
import type { Contact } from '@/types/database';

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
 * Create a new contact
 *
 * @param input - Contact data
 * @returns Created contact or error
 */
export async function createContact(
  input: Omit<CreateContactInput, 'created_by'>
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
    const validationResult = createContactSchema.safeParse({
      ...input,
      created_by: user.id,
    });

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    const validatedData = validationResult.data;

    // 3. Insert contact
    const { data: contact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        customer_id: validatedData.customer_id,
        full_name: validatedData.full_name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        job_title: validatedData.job_title || null,
        linkedin_url: validatedData.linkedin_url || null,
        department: validatedData.department || null,
        is_decision_maker: validatedData.is_decision_maker,
        is_primary: validatedData.is_primary,
        notes: validatedData.notes || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      return sanitizeError(insertError);
    }

    // 4. Revalidate cache
    revalidatePath(`/customers/${validatedData.customer_id}`);
    revalidatePath(`/customers/${validatedData.customer_id}/contacts`);

    return { success: true, data: { id: contact.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Update an existing contact
 *
 * @param input - Contact data with id
 * @returns Updated contact or error
 */
export async function updateContact(
  input: UpdateContactInput
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
    const validationResult = updateContactSchema.safeParse({
      ...input,
      updated_by: user.id,
    });

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    const validatedData = validationResult.data;

    // 3. Check if contact exists
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, customer_id')
      .eq('id', validatedData.id)
      .single();

    if (fetchError) {
      return sanitizeError(fetchError);
    }

    if (!existingContact) {
      return notFoundError('Kontakt');
    }

    // 4. Update contact
    const updateData: Record<string, unknown> = { updated_by: user.id };
    if (validatedData.full_name !== undefined) updateData.full_name = validatedData.full_name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.job_title !== undefined) updateData.job_title = validatedData.job_title || null;
    if (validatedData.linkedin_url !== undefined) updateData.linkedin_url = validatedData.linkedin_url || null;
    if (validatedData.department !== undefined) updateData.department = validatedData.department || null;
    if (validatedData.is_decision_maker !== undefined) updateData.is_decision_maker = validatedData.is_decision_maker;
    if (validatedData.is_primary !== undefined) updateData.is_primary = validatedData.is_primary;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;

    const { error: updateError } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', validatedData.id);

    if (updateError) {
      return sanitizeError(updateError);
    }

    // 5. Revalidate cache
    revalidatePath(`/customers/${existingContact.customer_id}`);
    revalidatePath(`/customers/${existingContact.customer_id}/contacts`);
    revalidatePath(`/customers/${existingContact.customer_id}/contacts/${validatedData.id}`);

    return { success: true, data: { id: validatedData.id } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Delete a contact
 *
 * @param contactId - Contact ID to delete
 * @returns Success or error
 */
export async function deleteContact(
  contactId: string
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

    // 2. Validate contact ID
    const validationResult = contactIdSchema.safeParse({ id: contactId });

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    // 3. Check if contact exists
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, customer_id')
      .eq('id', contactId)
      .single();

    if (fetchError) {
      return sanitizeError(fetchError);
    }

    if (!existingContact) {
      return notFoundError('Kontakt');
    }

    // 4. Delete contact
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (deleteError) {
      return sanitizeError(deleteError);
    }

    // 5. Revalidate cache
    revalidatePath(`/customers/${existingContact.customer_id}`);
    revalidatePath(`/customers/${existingContact.customer_id}/contacts`);

    return { success: true, data: { id: contactId } };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get a single contact by ID
 *
 * @param contactId - Contact ID
 * @returns Contact data or error
 */
export async function getContact(contactId: string): Promise<ActionResponse<Contact>> {
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

    // 2. Validate contact ID
    const validationResult = contactIdSchema.safeParse({ id: contactId });

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    // 3. Fetch contact (RLS policies enforce access control)
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (fetchError) {
      return sanitizeError(fetchError);
    }

    if (!contact) {
      return notFoundError('Kontakt');
    }

    return { success: true, data: contact };
  } catch (error) {
    return sanitizeError(error);
  }
}

/**
 * Get all contacts for a specific customer
 *
 * @param customerId - Customer ID
 * @returns Contacts array or error
 */
export async function getContactsForCustomer(
  customerId: string
): Promise<ActionResponse<Contact[]>> {
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
    const validationResult = customerIdForContactsSchema.safeParse({ customerId });

    if (!validationResult.success) {
      return sanitizeError(validationResult.error);
    }

    // 3. Fetch contacts for customer (RLS policies enforce access control)
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false })
      .order('full_name', { ascending: true });

    if (fetchError) {
      return sanitizeError(fetchError);
    }

    return { success: true, data: contacts || [] };
  } catch (error) {
    return sanitizeError(error);
  }
}
