/**
 * Join Request Management API Route
 * 
 * DELETE /api/community/join-request/:id - Cancel join request
 * PATCH /api/community/join-request/:id - Approve/Reject join request (moderator only)
 * 
 * @module app/api/community/join-request/[id]
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, parseRequestBody } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/supabase/server';

/**
 * DELETE /api/community/join-request/:id
 * 
 * Cancels a join request. Only the user who made the request can cancel it.
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing join request id
 * @returns Success message
 * 
 * @example
 * DELETE /api/community/join-request/request-uuid
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Join request cancelled"
 *   }
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Get authenticated user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized: Please log in', 401);
    }

    const { id } = params;

    if (!id) {
      return errorResponse('Join request ID is required', 400);
    }

    // Find join request
    const joinRequest = await prisma.communityJoinRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!joinRequest) {
      return errorResponse('Join request not found', 404);
    }

    // Verify user owns this request
    if (joinRequest.userId !== authUser.id) {
      return errorResponse('You can only cancel your own join requests', 403);
    }

    // Can only cancel pending requests
    if (joinRequest.status !== 'pending') {
      return errorResponse('Can only cancel pending join requests', 409);
    }

    // Delete the join request
    await prisma.communityJoinRequest.delete({
      where: { id },
    });

    return successResponse(
      { message: 'Join request cancelled' },
      200
    );
  } catch (error) {
    console.error('Cancel join request error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while cancelling join request',
      500
    );
  }
}

/**
 * PATCH /api/community/join-request/:id
 * 
 * Approve or reject a join request. Only community moderators can perform this action.
 * Approving a request adds the user to the community as a member.
 * Rejecting a request simply updates the status without adding the user.
 * 
 * @param request - Next.js Request object with action in body
 * @param params - Route parameters containing join request id
 * @returns Updated join request or success message
 * 
 * @example
 * PATCH /api/community/join-request/request-uuid
 * {
 *   "action": "approve"
 * }
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Join request approved",
 *     "joinRequest": {...}
 *   }
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Get authenticated user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized: Please log in', 401);
    }

    const { id } = params;

    if (!id) {
      return errorResponse('Join request ID is required', 400);
    }

    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    const action = body.action as string;
    if (!action || !['approve', 'reject'].includes(action)) {
      return errorResponse('Invalid action. Must be "approve" or "reject"', 400);
    }

    // Find join request with community info
    const joinRequest = await prisma.communityJoinRequest.findUnique({
      where: { id },
      include: {
        community: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!joinRequest) {
      return errorResponse('Join request not found', 404);
    }

    if (joinRequest.status !== 'pending') {
      return errorResponse('Can only respond to pending join requests', 409);
    }

    // Check if user is moderator or owner of the community
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: authUser.id,
          communityId: joinRequest.community.id,
        },
      },
      select: {
        role: true,
      },
    });

    const isOwner = joinRequest.community.ownerId === authUser.id;
    const isModerator = userMembership?.role === 'moderator';

    if (!isOwner && !isModerator) {
      return errorResponse(
        'Only community moderators or owner can respond to join requests',
        403
      );
    }

    // Update join request status
    const updatedRequest = await prisma.communityJoinRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        respondedAt: new Date(),
      },
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

    // If approved, add user to community as member
    if (action === 'approve') {
      await prisma.communityMember.create({
        data: {
          userId: joinRequest.userId,
          communityId: joinRequest.community.id,
          role: 'member',
        },
      });

      // Increment member count
      await prisma.community.update({
        where: { id: joinRequest.community.id },
        data: { memberCount: { increment: 1 } },
      });
    }

    return successResponse(
      {
        message: action === 'approve' 
          ? 'Join request approved and user added to community'
          : 'Join request rejected',
        joinRequest: updatedRequest,
      },
      200
    );
  } catch (error) {
    console.error('Respond to join request error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while responding to join request',
      500
    );
  }
}
