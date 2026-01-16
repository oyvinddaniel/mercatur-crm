/**
 * Communication Log Validation Schemas
 *
 * Zod validation for communication log input
 */

import { z } from 'zod';

/**
 * Communication type enum
 */
export const communicationTypeEnum = z.enum(['meeting', 'email', 'phone', 'other']);

/**
 * Create communication log schema
 */
export const createCommunicationSchema = z.object({
  customer_id: z.string().uuid({ message: 'Ugyldig kunde-ID' }),
  contact_id: z.string().uuid({ message: 'Ugyldig kontakt-ID' }).nullable().optional(),
  communication_type: communicationTypeEnum,
  communication_date: z.string().datetime({ message: 'Ugyldig dato format' }),
  subject: z.string().min(1, 'Emne er påkrevd').max(200, 'Emne kan ikke være lengre enn 200 tegn'),
  description: z.string().optional().or(z.literal('')),
});

export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>;

/**
 * Update communication log schema
 */
export const updateCommunicationSchema = z.object({
  id: z.string().uuid({ message: 'Ugyldig kommunikasjonslogg-ID' }),
  customer_id: z.string().uuid({ message: 'Ugyldig kunde-ID' }),
  contact_id: z.string().uuid({ message: 'Ugyldig kontakt-ID' }).nullable().optional(),
  communication_type: communicationTypeEnum,
  communication_date: z.string().datetime({ message: 'Ugyldig dato format' }),
  subject: z.string().min(1, 'Emne er påkrevd').max(200, 'Emne kan ikke være lengre enn 200 tegn'),
  description: z.string().optional().or(z.literal('')),
  updated_by: z.string().uuid({ message: 'Ugyldig bruker-ID' }),
});

export type UpdateCommunicationInput = z.infer<typeof updateCommunicationSchema>;

/**
 * Communication log ID schema
 */
export const communicationIdSchema = z.object({
  id: z.string().uuid({ message: 'Ugyldig kommunikasjonslogg-ID' }),
});
