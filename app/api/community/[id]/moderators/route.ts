/**
 * Community Moderator Management API Route
 * 
 * POST /api/community/:id/moderators - Add a moderator
 * DELETE /api/community/:id/moderators/:userId - Remove a moderator
 * 
 * @module app/api/community/[id]/moderators
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, parseRequestBody } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/supabase/server';

const MIN_MODERATORS = 2;
const MAX_MODERATORS = 5;

/**
 * POST /api/community/:id/moderators
 * 
 * Promotes a community member to moderator.
 * Only the community owner can perform this action.
 * A community must have at least 2 moderators and at most 5 moderators.
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id
 * @returns Updated member with new role
 * 
 * @example
 * POST /api/community/community-uuid/moderators
 * {
 *   "userId": "user-uuid"
 * }
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "User promoted to moderator",
 *     "member": {...}
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

    const body = await parseRequestBody(request);

    if (!body || !body.userId) {
      return errorResponse('User ID is required', 400);
    }

    const userId = body.userId as string;

    // Check if user is the community owner
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!community) {
      return errorResponse('Community not found', 404);
    }

    if (community.ownerId !== authUser.id) {
      return errorResponse('Only the community owner can manage moderators', 403);
    }

    // Check if target user is a member
    const targetMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    if (!targetMember) {
      return errorResponse('User is not a member of this community', 404);
    }

    if (targetMember.role === 'moderator') {
      return errorResponse('User is already a moderator', 409);
    }

    if (targetMember.role === 'owner') {
      return errorResponse('Cannot promote owner role', 409);
    }

    // Check current moderator count
    const moderatorCount = await prisma.communityMember.count({
      where: {
        communityId,
        role: 'moderator',
      },
    });

    if (moderatorCount >= MAX_MODERATORS) {
      return errorResponse(
        `Community has reached maximum moderators (${MAX_MODERATORS})`,
        409
      );
    }

    // Promote user to moderator
    const updatedMember = await prisma.communityMember.update({
      where: { id: targetMember.id },
      data: { role: 'moderator' },
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
    });

    return successResponse(
      {
        message: 'User promoted to moderator',
        member: updatedMember,
      },
      200
    );
  } catch (error) {
    console.error('Add moderator error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while promoting user to moderator',
      500
    );
  }
}

/**
 * DELETE /api/community/:id/moderators/:userId
 * 
 * Demotes a moderator back to regular member.
 * Only the community owner can perform this action.
 * A community must maintain at least 2 moderators.
 * The owner cannot be demoted.
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id and user id
 * @returns Updated member with new role
 * 
 * @example
 * DELETE /api/community/community-uuid/moderators/user-uuid
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "User demoted from moderator",
 *     "member": {...}
 *   }
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
): Promise<NextResponse> {
  try {
    // Get authenticated user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized: Please log in', 401);
    }

    const { id: communityId, userId } = params;

    if (!communityId || !userId) {
      return errorResponse('Community ID and User ID are required', 400);
    }

    // Check if user is the community owner
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!community) {
      return errorResponse('Community not found', 404);
    }

    if (community.ownerId !== authUser.id) {
      return errorResponse('Only the community owner can manage moderators', 403);
    }

    // Cannot demote the owner
    if (userId === community.ownerId) {
      return errorResponse('Cannot demote the community owner', 403);
    }

    // Find the target member
    const targetMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    if (!targetMember) {
      return errorResponse('User is not a member of this community', 404);
    }

    if (targetMember.role !== 'moderator') {
      return errorResponse('User is not a moderator', 409);
    }

    // Check current moderator count
    const moderatorCount = await prisma.communityMember.count({
      where: {
        communityId,
        role: 'moderator',
      },
    });

    if (moderatorCount <= MIN_MODERATORS) {
      return errorResponse(
        `Community must maintain at least ${MIN_MODERATORS} moderators`,
        409
      );
    }

    // Demote user back to member
    const updatedMember = await prisma.communityMember.update({
      where: { id: targetMember.id },
      data: { role: 'member' },
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
    });

    return successResponse(
      {
        message: 'User demoted from moderator',
        member: updatedMember,
      },
      200
    );
  } catch (error) {
    console.error('Remove moderator error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while demoting user',
      500
    );
  }
}
