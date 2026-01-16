/**
 * Mercatur CRM - Customer Validation Schemas
 *
 * Zod schemas for server-side validation of customer data.
 * Prevents SQL injection and ensures data integrity.
 *
 * Reference: docs/security/sql-injection-prevention.md
 */

import { z } from 'zod';

// Norwegian organization number validation (9 digits)
const orgNumberRegex = /^\d{9}$/;

/**
 * Customer creation schema
 * Used when creating a new customer
 */
export const createCustomerSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Firmanavn er påkrevd')
    .max(255, 'Firmanavn kan ikke være lengre enn 255 tegn')
    .trim(),

  org_number: z
    .string()
    .regex(orgNumberRegex, 'Organisasjonsnummer må være 9 siffer')
    .optional()
    .nullable(),

  industry: z
    .string()
    .max(100, 'Bransje kan ikke være lengre enn 100 tegn')
    .trim()
    .optional()
    .nullable(),

  website: z
    .string()
    .url('Ugyldig nettside-URL')
    .max(255, 'Nettside-URL kan ikke være lengre enn 255 tegn')
    .optional()
    .nullable()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, 'Adresse kan ikke være lengre enn 500 tegn')
    .trim()
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(2000, 'Notater kan ikke være lengre enn 2000 tegn')
    .optional()
    .nullable(),

  lifecycle_stage: z
    .enum(['lead', 'prospect', 'customer', 'active', 'former'])
    .optional()
    .nullable(),

  customer_status: z
    .enum(['active', 'inactive', 'potential', 'lost'])
    .optional()
    .nullable(),

  lead_source: z
    .string()
    .max(255, 'Lead-kilde kan ikke være lengre enn 255 tegn')
    .trim()
    .optional()
    .nullable(),

  annual_revenue: z
    .number()
    .nonnegative('Årlig omsetning kan ikke være negativ')
    .optional()
    .nullable(),

  next_contact_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig datoformat (YYYY-MM-DD)')
    .optional()
    .nullable(),

  assigned_to: z
    .string()
    .uuid('Ugyldig bruker-ID')
    .optional()
    .nullable(),

  created_by: z
    .string()
    .uuid('Ugyldig bruker-ID'),
});

/**
 * Customer update schema
 * Same as create but all fields optional except id
 */
export const updateCustomerSchema = z.object({
  id: z.string().uuid('Ugyldig kunde-ID'),

  company_name: z
    .string()
    .min(1, 'Firmanavn er påkrevd')
    .max(255, 'Firmanavn kan ikke være lengre enn 255 tegn')
    .trim()
    .optional(),

  org_number: z
    .string()
    .regex(orgNumberRegex, 'Organisasjonsnummer må være 9 siffer')
    .optional()
    .nullable(),

  industry: z
    .string()
    .max(100, 'Bransje kan ikke være lengre enn 100 tegn')
    .trim()
    .optional()
    .nullable(),

  website: z
    .string()
    .url('Ugyldig nettside-URL')
    .max(255, 'Nettside-URL kan ikke være lengre enn 255 tegn')
    .optional()
    .nullable()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, 'Adresse kan ikke være lengre enn 500 tegn')
    .trim()
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(2000, 'Notater kan ikke være lengre enn 2000 tegn')
    .optional()
    .nullable(),

  lifecycle_stage: z
    .enum(['lead', 'prospect', 'customer', 'active', 'former'])
    .optional()
    .nullable(),

  customer_status: z
    .enum(['active', 'inactive', 'potential', 'lost'])
    .optional()
    .nullable(),

  lead_source: z
    .string()
    .max(255, 'Lead-kilde kan ikke være lengre enn 255 tegn')
    .trim()
    .optional()
    .nullable(),

  annual_revenue: z
    .number()
    .nonnegative('Årlig omsetning kan ikke være negativ')
    .optional()
    .nullable(),

  next_contact_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig datoformat (YYYY-MM-DD)')
    .optional()
    .nullable(),

  assigned_to: z
    .string()
    .uuid('Ugyldig bruker-ID')
    .optional()
    .nullable(),
});

/**
 * Customer ID schema
 * Used for operations that only need the customer ID
 */
export const customerIdSchema = z.object({
  id: z.string().uuid('Ugyldig kunde-ID'),
});

/**
 * Type exports for TypeScript
 */
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerIdInput = z.infer<typeof customerIdSchema>;
