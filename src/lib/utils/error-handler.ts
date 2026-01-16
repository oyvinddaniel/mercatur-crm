/**
 * Mercatur CRM - Error Sanitization Utility
 *
 * Prevents information disclosure in production by sanitizing error messages.
 * Ensures no database structure, table names, or file paths are exposed.
 *
 * Reference: docs/security/production-error-handling.md
 */

import { ZodError } from 'zod';

/**
 * Standard error response
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: string;
}

/**
 * Error codes for different error types
 */
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  CONFLICT = 'CONFLICT',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Sanitize error for production environment
 *
 * Removes sensitive information like:
 * - Table/column names
 * - File paths
 * - Stack traces
 * - Database error details
 *
 * @param error - The error to sanitize
 * @returns Sanitized error response
 */
export function sanitizeError(error: unknown): ErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    return {
      error: firstError.message,
      code: ErrorCode.VALIDATION_ERROR,
      details: isDevelopment ? JSON.stringify(error.issues) : undefined,
    };
  }

  // PostgreSQL/Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string; message: string; details?: string };

    // Duplicate key violation (23505)
    if (pgError.code === '23505') {
      return {
        error: 'En post med denne informasjonen finnes allerede',
        code: ErrorCode.DUPLICATE_RECORD,
        details: isDevelopment ? pgError.message : undefined,
      };
    }

    // Foreign key violation (23503)
    if (pgError.code === '23503') {
      return {
        error: 'Kan ikke utføre operasjonen - relaterte data finnes',
        code: ErrorCode.CONFLICT,
        details: isDevelopment ? pgError.message : undefined,
      };
    }

    // Not null violation (23502)
    if (pgError.code === '23502') {
      return {
        error: 'Påkrevd informasjon mangler',
        code: ErrorCode.INVALID_INPUT,
        details: isDevelopment ? pgError.message : undefined,
      };
    }

    // Check violation (23514)
    if (pgError.code === '23514') {
      return {
        error: 'Ugyldig data - sjekk dine inntastinger',
        code: ErrorCode.INVALID_INPUT,
        details: isDevelopment ? pgError.message : undefined,
      };
    }

    // Other database errors
    return {
      error: 'En databasefeil oppstod. Vennligst prøv igjen.',
      code: ErrorCode.DATABASE_ERROR,
      details: isDevelopment ? pgError.message : undefined,
    };
  }

  // Supabase client errors
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as { message: string };

    // Authorization errors
    if (err.message.includes('JWT') || err.message.includes('auth')) {
      return {
        error: 'Du er ikke autorisert til å utføre denne handlingen',
        code: ErrorCode.UNAUTHORIZED,
        details: isDevelopment ? err.message : undefined,
      };
    }

    // RLS policy violations (typically mean FORBIDDEN)
    if (err.message.includes('policy') || err.message.includes('row-level security')) {
      return {
        error: 'Du har ikke tilgang til denne ressursen',
        code: ErrorCode.FORBIDDEN,
        details: isDevelopment ? err.message : undefined,
      };
    }

    // Not found errors
    if (err.message.includes('not found') || err.message.includes('no rows')) {
      return {
        error: 'Ressursen ble ikke funnet',
        code: ErrorCode.NOT_FOUND,
        details: isDevelopment ? err.message : undefined,
      };
    }
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      error: 'En uventet feil oppstod. Vennligst prøv igjen.',
      code: ErrorCode.INTERNAL_ERROR,
      details: isDevelopment ? error.message : undefined,
    };
  }

  // Unknown error type
  return {
    error: 'En ukjent feil oppstod. Vennligst prøv igjen.',
    code: ErrorCode.UNKNOWN_ERROR,
    details: isDevelopment ? String(error) : undefined,
  };
}

/**
 * Authorization error helper
 */
export function unauthorizedError(): ErrorResponse {
  return {
    error: 'Du må være logget inn for å utføre denne handlingen',
    code: ErrorCode.UNAUTHORIZED,
  };
}

/**
 * Forbidden error helper
 */
export function forbiddenError(): ErrorResponse {
  return {
    error: 'Du har ikke tilgang til denne ressursen',
    code: ErrorCode.FORBIDDEN,
  };
}

/**
 * Not found error helper
 */
export function notFoundError(resourceType: string = 'Ressursen'): ErrorResponse {
  return {
    error: `${resourceType} ble ikke funnet`,
    code: ErrorCode.NOT_FOUND,
  };
}

/**
 * Validation error helper
 */
export function validationError(message: string): ErrorResponse {
  return {
    error: message,
    code: ErrorCode.VALIDATION_ERROR,
  };
}
