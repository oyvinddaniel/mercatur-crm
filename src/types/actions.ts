/**
 * Shared Action Response Types
 *
 * Standard response types for Server Actions
 */

import type { ErrorResponse } from '@/lib/utils/error-handler';

/**
 * Standard success response
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Action response type
 * Either a success response with data or an error response
 */
export type ActionResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
