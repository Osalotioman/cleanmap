
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-utils';

/**
 * GET /api/auth/profile
 * 
 * Fetches the profile of the currently authenticated user.
 * 
 * @param request - Next.js Request object
 * @returns User profile data
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Get authenticated user from Supabase session
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return errorResponse('Unauthorized', 401);
    }

    // Fetch user profile from Prisma, including volunteer details
    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
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

    if (!userProfile) {
      return errorResponse('User profile not found in database.', 404);
    }

    return successResponse({ user: userProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
}
