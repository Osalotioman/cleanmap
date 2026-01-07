/**
 * Leave Community API Route
 * 
 * POST /api/community/:id/leave
 * Allows a user to leave a community
 * 
 * @module app/api/community/[id]/leave
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/supabase/server';

/**
 * POST /api/community/:id/leave
 * 
 * Removes the authenticated user from a community.
 * Cannot be used by the community owner to leave (owner must delete community or transfer ownership).
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id
 * @returns Success message
 * 
 * @example
 * POST /api/community/community-uuid/leave
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "You have left the community"
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Get authenticated user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized: Please log in', 401);
    }

    const { id: communityId } = params;

    if (!communityId) {
      return errorResponse('Community ID is required', 400);
    }

    // Check if community exists and user is a member
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        ownerId: true,
        memberCount: true,
      },
    });

    if (!community) {
      return errorResponse('Community not found', 404);
    }

    // Cannot allow owner to leave without transferring ownership
    if (community.ownerId === authUser.id) {
      return errorResponse(
        'Community owner cannot leave. Please transfer ownership or delete the community.',
        403
      );
    }

    // Find and delete user membership
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: authUser.id,
          communityId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      return errorResponse('You are not a member of this community', 404);
    }

    // Delete membership
    await prisma.communityMember.delete({
      where: { id: membership.id },
    });

    // Decrement member count
    await prisma.community.update({
      where: { id: communityId },
      data: { memberCount: { decrement: 1 } },
    });

    return successResponse(
      { message: 'You have left the community' },
      200
    );
  } catch (error) {
    console.error('Leave community error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while leaving the community',
      500
    );
  }
}
