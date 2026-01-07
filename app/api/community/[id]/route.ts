/**
 * Get Community Details API Route
 * 
 * GET /api/community/:id
 * Fetches detailed information about a community
 * 
 * @module app/api/community/[id]
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/supabase/server';

/**
 * GET /api/community/:id
 * 
 * Fetches detailed information about a specific community including:
 * - Community metadata
 * - Member list with roles
 * - Owner information
 * - User's membership status (if authenticated)
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id
 * @returns Community details with members
 * 
 * @example
 * GET /api/community/community-uuid
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "community": {
 *       "id": "uuid",
 *       "name": "Downtown Cleanup",
 *       "description": "...",
 *       "location": "Downtown",
 *       "coverageType": "neighborhood",
 *       "status": "active",
 *       "memberCount": 5,
 *       "createdAt": "2024-01-01T00:00:00Z",
 *       "updatedAt": "2024-01-07T00:00:00Z",
 *       "owner": {...},
 *       "members": [...]
 *     },
 *     "userRole": "member",
 *     "isMember": true
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: communityId } = params;

    if (!communityId) {
      return errorResponse('Community ID is required', 400);
    }

    // Get community details with all members
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
      },
    });

    if (!community) {
      return errorResponse('Community not found', 404);
    }

    // Get authenticated user if available
    const authUser = await getAuthUser(request);
    let userRole: string | null = null;
    let isMember = false;

    if (authUser) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: authUser.id,
            communityId,
          },
        },
        select: {
          role: true,
        },
      });

      if (membership) {
        userRole = membership.role;
        isMember = true;
      }
    }

    return successResponse(
      {
        community,
        userRole,
        isMember,
      },
      200
    );
  } catch (error) {
    console.error('Get community details error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching community details',
      500
    );
  }
}
