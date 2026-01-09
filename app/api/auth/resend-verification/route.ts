/**
 * Resend Verification Email API Route
 * 
 * POST /api/auth/resend-verification
 * Resends the email verification link to the user.
 * 
 * @module app/api/auth/resend-verification
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateEmail,
  validateRequiredFields,
} from '@/lib/api-utils';

/**
 * Request body structure for resending verification
 */
interface ResendVerificationRequest {
  email: string;
}

/**
 * POST /api/auth/resend-verification
 * 
 * Resends email verification link to the user.
 * 
 * @param request - Next.js Request object
 * @returns Success message or error response
 * 
 * @example
 * POST /api/auth/resend-verification
 * {
 *   "email": "user@example.com"
 * }
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Verification email sent. Please check your inbox."
 * }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    // Validate required fields
    const requiredValidation = validateRequiredFields(body, ['email']);
    if (!requiredValidation.isValid) {
      return errorResponse(requiredValidation.error!, 400);
    }

    const { email } = body as unknown as ResendVerificationRequest;

    // Validate email format
    if (!validateEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Get origin for redirect URL
    const requestUrl = new URL(request.url);
    const origin = request.headers.get('origin') ?? `${requestUrl.protocol}//${requestUrl.host}`;
    const emailRedirectTo = `${origin}/auth/confirm`;

    console.log('📧 Resending verification email to:', email.toLowerCase());
    console.log('🔗 Redirect URL:', emailRedirectTo);

    // Resend verification email using Supabase
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      console.error('❌ Resend verification error:', error);
      console.error('Error details:', {
        message: error.message,
        status: (error as unknown as { status?: number }).status,
        code: (error as unknown as { code?: string }).code,
      });
      
      // Don't reveal if email exists or not (security best practice)
      // Return success even if email doesn't exist
      if (error.message.toLowerCase().includes('user not found') || 
          error.message.toLowerCase().includes('email not found') ||
          error.message.toLowerCase().includes('not found')) {
        console.log('⚠️ User not found, returning generic success message');
        return successResponse(
          null,
          200,
          'If an account exists with this email, a verification link has been sent.'
        );
      }

      // For other errors, return generic message
      return errorResponse(
        'Unable to resend verification email. Please try again later.',
        500,
        { errorMessage: error.message }
      );
    }

    console.log('✅ Verification email sent successfully');
    
    // Return success (don't reveal if email exists or not)
    return successResponse(
      null,
      200,
      'Verification email sent. Please check your inbox and spam folder.'
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
}
