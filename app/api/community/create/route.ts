/**
 * Create Community API Route
 * 
 * POST /api/community/create
 * Creates a new community and adds the user as owner
 * 
 * @module app/api/community/create
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateRequiredFields,
} from '@/lib/api-utils';
import { CreateCommunityRequest } from '@/types/community';
import { getAuthUser } from '@/lib/supabase/server';

/**
 * POST /api/community/create
 * 
 * Creates a new community and automatically adds the creator as owner.
 * Requires authentication.
 * 
 * @param request - Next.js Request object
 * @returns Created community and membership details
 * 
 * @example
 * POST /api/community/create
 * {
 *   "name": "Downtown Cleanup Initiative",
 *   "description": "A community dedicated to cleaning our downtown streets",
 *   "location": "Downtown, City Center",
 *   "coverageType": "neighborhood",
 *   "guidelines": "Weekly meetups on Saturdays at 9 AM"
 * }
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "community": {
 *       "id": "uuid",
 *       "ownerId": "user-uuid",
 *       "name": "Downtown Cleanup Initiative",
 *       "description": "...",
 *       "location": "Downtown, City Center",
 *       "coverageType": "neighborhood",
 *       "guidelines": "...",
 *       "status": "active",
 *       "memberCount": 1,
 *       "createdAt": "2024-01-01T00:00:00Z",
 *       "updatedAt": "2024-01-01T00:00:00Z"
 *     },
 *     "membership": {
 *       "id": "uuid",
 *       "userId": "user-uuid",
 *       "communityId": "community-uuid",
 *       "role": "owner",
 *       "joinedAt": "2024-01-01T00:00:00Z"
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from Supabase
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorResponse('Unauthorized: Please log in to create a community', 401);
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true },
    });

    if (!user) {
      return errorResponse('User profile not found. Please log in again.', 404);
    }

    // Parse request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    // Validate required fields
    const requiredValidation = validateRequiredFields(body, ['name', 'location']);
    if (!requiredValidation.isValid) {
      return errorResponse(requiredValidation.error!, 400);
    }

    const {
      name,
      description,
      location,
      coverageType = 'neighborhood',
      guidelines,
    } = body as unknown as CreateCommunityRequest;

    // Validate inputs
    if (typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Community name must be a non-empty string', 400);
    }

    if (typeof location !== 'string' || location.trim().length === 0) {
      return errorResponse('Location must be a non-empty string', 400);
    }

    const validCoverageTypes = ['neighborhood', 'district', 'city'];
    if (!validCoverageTypes.includes(coverageType)) {
      return errorResponse(
        `Invalid coverage type. Must be one of: ${validCoverageTypes.join(', ')}`,
        400
      );
    }

    if (name.length > 255) {
      return errorResponse('Community name must not exceed 255 characters', 400);
    }

    if (location.length > 255) {
      return errorResponse('Location must not exceed 255 characters', 400);
    }

    if (description && description.length > 1000) {
      return errorResponse('Description must not exceed 1000 characters', 400);
    }

    if (guidelines && guidelines.length > 2000) {
      return errorResponse('Guidelines must not exceed 2000 characters', 400);
    }

    // Create community and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create community
      const community = await tx.community.create({
        data: {
          name: name.trim(),
          // The current schema models communities as geographic circles
          state: location.trim(),
          centerLat: 0,
          centerLon: 0,
          radius: 2000,
          createdBy: user.id,
        },
        select: {
          id: true,
          name: true,
          state: true,
          centerLat: true,
          centerLon: true,
          radius: true,
          createdBy: true,
          createdAt: true,
        },
      });

      // Create owner membership
      const membership = await tx.communityMember.create({
        data: {
          volunteerId: user.id,
          communityId: community.id,
        },
        select: {
          volunteerId: true,
          communityId: true,
          joinedAt: true,
        },
      });

      return { community, membership };
    });

  return successResponse(result as unknown as Record<string, unknown>, 201);
  } catch (error) {
    console.error('Create community error:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return errorResponse('A community with this name already exists', 409);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse(
      'An unexpected error occurred while creating the community',
      500
    );
  }
}
