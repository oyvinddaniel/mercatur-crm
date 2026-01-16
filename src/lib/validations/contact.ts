/**
 * Mercatur CRM - Contact Validation Schemas
 *
 * Zod schemas for validating contact input with Norwegian error messages.
 *
 * Reference: docs/krav/datamodell.md (Section 3: contacts)
 */

import { z } from 'zod';

/**
 * Create Contact Schema
 * Used when creating a new contact
 */
export const createContactSchema = z.object({
  customer_id: z.string().uuid({ message: 'Ugyldig kunde-ID' }),
  full_name: z
    .string()
    .min(1, { message: 'Fullt navn er påkrevd' })
    .max(200, { message: 'Navnet kan ikke være lengre enn 200 tegn' }),
  email: z
    .string()
    .email({ message: 'Ugyldig e-postadresse' })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, { message: 'Telefonnummer kan ikke være lengre enn 20 tegn' })
    .optional()
    .or(z.literal('')),
  job_title: z.string().optional().or(z.literal('')),
  linkedin_url: z
    .string()
    .url({ message: 'Ugyldig LinkedIn URL' })
    .optional()
    .or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  is_decision_maker: z.boolean().default(false),
  is_primary: z.boolean().default(false),
  notes: z.string().optional().or(z.literal('')),
  created_by: z.string().uuid(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

/**
 * Update Contact Schema
 * Used when updating an existing contact
 */
export const updateContactSchema = z.object({
  id: z.string().uuid({ message: 'Ugyldig kontakt-ID' }),
  customer_id: z.string().uuid({ message: 'Ugyldig kunde-ID' }).optional(),
  full_name: z
    .string()
    .min(1, { message: 'Fullt navn er påkrevd' })
    .max(200, { message: 'Navnet kan ikke være lengre enn 200 tegn' })
    .optional(),
  email: z
    .string()
    .email({ message: 'Ugyldig e-postadresse' })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, { message: 'Telefonnummer kan ikke være lengre enn 20 tegn' })
    .optional()
    .or(z.literal('')),
  job_title: z.string().optional().or(z.literal('')),
  linkedin_url: z
    .string()
    .url({ message: 'Ugyldig LinkedIn URL' })
    .optional()
    .or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  is_decision_maker: z.boolean().optional(),
  is_primary: z.boolean().optional(),
  notes: z.string().optional().or(z.literal('')),
  updated_by: z.string().uuid(),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;

/**
 * Contact ID Schema
 * Used for validating contact ID in queries
 */
export const contactIdSchema = z.object({
  id: z.string().uuid({ message: 'Ugyldig kontakt-ID' }),
});

/**
 * Customer ID Schema
 * Used when fetching contacts for a specific customer
 */
export const customerIdForContactsSchema = z.object({
  customerId: z.string().uuid({ message: 'Ugyldig kunde-ID' }),
});
