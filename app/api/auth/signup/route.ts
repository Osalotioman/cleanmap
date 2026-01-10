/**
 * Signup API Route
 * 
 * POST /api/auth/signup
 * Creates a new user account using Supabase Auth and Prisma.
 * 
 * @module app/api/auth/signup
 */

import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateEmail,
  validatePassword,
  validateRequiredFields,
} from '@/lib/api-utils';

/**
 * Request body structure for signup
 */
interface SignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * POST /api/auth/signup
 * 
 * Creates a new user account with Supabase Auth and Prisma profile.
 * 
 * @param request - Next.js Request object
 * @returns User creation success or error response
 * 
 * @example
 * POST /api/auth/signup
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "firstName": "John",
 *   "lastName": "Doe"
 * }
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "message": "User created successfully. Please check your email to verify your account.",
 *   "data": {
 *     "user": {
 *       "id": "uuid",
 *       "email": "user@example.com",
 *       "role": "anonymous"
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

    const { email, password, firstName, lastName } = body as unknown as SignupRequest;

    // Validate email format
    if (!validateEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return errorResponse(passwordValidation.error!, 400);
    }

    // Check if user already exists in Prisma
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return errorResponse('User with this email already exists', 409);
      }
    } catch (dbError) {
      console.error('Database error checking existing user:', dbError);
      return errorResponse(
        'Unable to verify account availability. Please try again later.',
        503
      );
    }

    // Create Supabase Auth user with user-facing client so confirmation email is sent
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const emailRedirectTo = `${process.env.FRONTEND_URL}/auth/confirm`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          firstName,
          lastName,
        },
        emailRedirectTo,
      },
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return errorResponse(
        authError.message || 'Failed to create user account',
        400
      );
    }

    if (!authData.user) {
      return errorResponse('Failed to create user account', 500);
    }

    // Ensure authData.user is not null for TypeScript within the transaction
    const currentUser = authData.user;
    
    // Create Prisma user profile
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Form volunteer name
        const volunteerName = (firstName && lastName)
          ? `${firstName} ${lastName}`.trim()
          : (firstName || lastName || email.toLowerCase());

        // Create Volunteer record
        const volunteer = await tx.volunteer.create({
          data: {
            name: volunteerName,
            email: email.toLowerCase(),
          },
        });

        // Create User record, linking to the new Volunteer
        const user = await tx.user.create({
          data: {
            id: currentUser.id,
            email: email.toLowerCase(),
            passwordHash: `supabase:${currentUser.id}`,
            role: 'volunteer', // Keep as 'volunteer'
            status: 'active',
            firstName: firstName || null,
            lastName: lastName || null,
            volunteerId: volunteer.id, // Link volunteer here
          },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            // Include volunteerId in select for consistency, though not strictly needed for this API's return
            volunteerId: true,
          },
        });

        return { user, volunteer };
      });

      return successResponse(
        { user: result.user }, // Return the user object
        201,
        'User and volunteer profile created successfully. Please check your email to verify your account.'
      );
    } catch (prismaError) {
      // Rollback: Delete Supabase user if Prisma creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);

      console.error('Prisma user creation error:', prismaError);
      return errorResponse(
        'Unable to complete registration. Please try again later.',
        503
      );
    }
  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
}
