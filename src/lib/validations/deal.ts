/**
 * Deal Validation Schemas
 *
 * Zod validation for deal input
 */

import { z } from 'zod';

/**
 * Deal stage enum
 */
export const dealStageEnum = z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']);

/**
 * Create deal schema
 */
export const createDealSchema = z.object({
  customer_id: z.string().uuid({ message: 'Ugyldig kunde-ID' }),
  deal_name: z.string().min(1, 'Navn er påkrevd').max(200, 'Navn kan ikke være lengre enn 200 tegn'),
  deal_value: z.number().min(0, 'Verdi må være 0 eller høyere'),
  currency: z.string().length(3, 'Valuta må være 3 tegn (f.eks. NOK, USD)').default('NOK'),
  stage: dealStageEnum,
  probability: z.number().min(0, 'Sannsynlighet må være mellom 0 og 100').max(100, 'Sannsynlighet må være mellom 0 og 100'),
  expected_close_date: z.string().optional().or(z.literal('')),
  actual_close_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;

/**
 * Update deal schema
 */
export const updateDealSchema = z.object({
  id: z.string().uuid({ message: 'Ugyldig deal-ID' }),
  customer_id: z.string().uuid({ message: 'Ugyldig kunde-ID' }),
  deal_name: z.string().min(1, 'Navn er påkrevd').max(200, 'Navn kan ikke være lengre enn 200 tegn'),
  deal_value: z.number().min(0, 'Verdi må være 0 eller høyere'),
  currency: z.string().length(3, 'Valuta må være 3 tegn (f.eks. NOK, USD)'),
  stage: dealStageEnum,
  probability: z.number().min(0, 'Sannsynlighet må være mellom 0 og 100').max(100, 'Sannsynlighet må være mellom 0 og 100'),
  expected_close_date: z.string().optional().or(z.literal('')),
  actual_close_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  updated_by: z.string().uuid({ message: 'Ugyldig bruker-ID' }),
});

export type UpdateDealInput = z.infer<typeof updateDealSchema>;

/**
 * Deal ID schema
 */
export const dealIdSchema = z.object({
  id: z.string().uuid({ message: 'Ugyldig deal-ID' }),
});
