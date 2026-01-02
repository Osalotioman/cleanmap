/**
 * API Utilities
 * 
 * Standardized response handlers and validation helpers for API routes.
 * Ensures consistent response format across all endpoints.
 * 
 * @module lib/api-utils
 */

import { NextResponse } from 'next/server';

/**
 * Standard API success response structure
 */
interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error response structure
 */
interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Creates a standardized success response
 * 
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @param message - Optional success message
 * @returns NextResponse with standardized success format
 * 
 * @example
 * return successResponse({ user, token }, 200, 'Login successful');
 */
export function successResponse<T>(
  data: T,
  status = 200,
  message?: string
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Creates a standardized error response
 * 
 * @param error - Error message or Error object
 * @param status - HTTP status code (default: 400)
 * @param details - Optional additional error details
 * @returns NextResponse with standardized error format
 * 
 * @example
 * return errorResponse('Invalid email format', 400);
 */
export function errorResponse(
  error: string | Error,
  status = 400,
  details?: unknown
): NextResponse<ErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : error;

  const response: ErrorResponse = {
    success: false,
    error: errorMessage,
  };

  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Email validation regex
 * Matches most common email formats
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address format
 * 
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 * 
 * @example
 * if (!validateEmail(email)) {
 *   return errorResponse('Invalid email format', 400);
 * }
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates password strength
 * 
 * Requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 * 
 * @param password - Password to validate
 * @returns Object with isValid flag and error message if invalid
 * 
 * @example
 * const validation = validatePassword(password);
 * if (!validation.isValid) {
 *   return errorResponse(validation.error, 400);
 * }
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character',
    };
  }

  return { isValid: true };
}

/**
 * Validates required fields in request body
 * 
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @returns Object with isValid flag and error message if invalid
 * 
 * @example
 * const validation = validateRequiredFields(body, ['email', 'password']);
 * if (!validation.isValid) {
 *   return errorResponse(validation.error, 400);
 * }
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): {
  isValid: boolean;
  error?: string;
} {
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Safely parses JSON request body
 * 
 * @param request - Next.js Request object
 * @returns Parsed body or null if parsing fails
 * 
 * @example
 * const body = await parseRequestBody(request);
 * if (!body) {
 *   return errorResponse('Invalid JSON in request body', 400);
 * }
 */
export async function parseRequestBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Extracts and validates Bearer token from Authorization header
 * 
 * @param request - Next.js Request object
 * @returns Token string or null if not found/invalid
 * 
 * @example
 * const token = getBearerToken(request);
 * if (!token) {
 *   return errorResponse('Missing authorization token', 401);
 * }
 */
export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Handles async errors in route handlers
 * 
 * @param fn - Async route handler function
 * @returns Wrapped handler with error handling
 * 
 * @example
 * export const POST = withErrorHandling(async (request) => {
 *   // Your handler logic
 * });
 */
export function withErrorHandling(
  fn: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      return await fn(request);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof Error) {
        return errorResponse(error.message, 500);
      }

      return errorResponse('An unexpected error occurred', 500);
    }
  };
}
