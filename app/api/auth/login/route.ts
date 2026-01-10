/**
 * Login API Route
 * 
 * POST /api/auth/login
 * Authenticates a user with Supabase Auth and returns user profile + JWT token.
 * 
 * @module app/api/auth/login
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/services/token-service';
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateEmail,
  validateRequiredFields,
} from '@/lib/api-utils';

/**
 * Request body structure for login
 */
interface LoginRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and returns their profile with JWT token.
 * 
 * @param request - Next.js Request object
 * @returns User profile, JWT token, and Supabase session
 * 
 * @example
 * POST /api/auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "user": {
 *       "id": "uuid",
 *       "email": "user@example.com",
 *       "role": "anonymous",
 *       "firstName": "John",
 *       "lastName": "Doe"
 *     },
 *     "token": "jwt-token-string",
 *     "supabaseSession": {
 *       "access_token": "...",
 *       "refresh_token": "...",
 *       "expires_in": 3600
 *     }
 *   }
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
    const requiredValidation = validateRequiredFields(body, ['email', 'password']);
    if (!requiredValidation.isValid) {
      return errorResponse(requiredValidation.error!, 400);
    }

    const { email, password } = body as unknown as LoginRequest;

    // Validate email format
    if (!validateEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Authenticate with Supabase (using regular client, not admin)
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

    // Handle authentication errors
    if (authError) {
      console.error('Supabase auth error:', authError);
      console.error('Error code:', (authError as unknown as { code?: string }).code);
      console.error('Error status:', authError.status);
      console.error('Error message:', authError.message);
      
      // Check if it's an email not confirmed error
      // Supabase uses specific error code for unverified emails
      const errorCode = (authError as unknown as { code?: string }).code;
      const errorMsg = authError.message.toLowerCase();
      
      if (
        errorCode === 'email_not_confirmed' ||
        errorMsg.includes('email not confirmed') ||
        errorMsg.includes('email verification') ||
        errorMsg.includes('verify your email') ||
        errorMsg.includes('not verified')
      ) {
        return errorResponse(
          'Please verify your email address. Check your inbox for the verification link.',
          403,
          { 
            needsEmailVerification: true,
            email: email.toLowerCase(),
            code: 'EMAIL_NOT_VERIFIED'
          }
        );
      }
      
      // Generic authentication error (wrong password, user not found, etc.)
      return errorResponse('Invalid email or password', 401);
    }

    if (!authData.user) {
      return errorResponse('Authentication failed', 401);
    }

    // Fetch or create user profile from Prisma
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: authData.user.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
          volunteer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // If user doesn't exist in Prisma, create profile
      // (This handles users created directly in Supabase)
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: authData.user.id,
            email: email.toLowerCase(),
            passwordHash: `supabase:${authData.user.id}`,
            role: 'anonymous',
            status: 'active',
          },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return errorResponse(
        'Unable to access user profile. Please try again later.',
        503
      );
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return errorResponse('Account is inactive. Please contact support.', 403);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user profile, token, and Supabase session
    return successResponse(
      {
        user,
        token,
        supabaseSession: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_in: authData.session?.expires_in,
          expires_at: authData.session?.expires_at,
        },
      },
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
}
