/**
 * Claim/Unclaim Waste Issue API Route
 * 
 * POST /api/community/:id/claim-issue - Claim a waste issue for the community
 * DELETE /api/community/:id/claim-issue/:issueId - Unclaim a waste issue
 * 
 * @module app/api/community/[id]/claim-issue
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, parseRequestBody } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/supabase/server';

/**
 * POST /api/community/:id/claim-issue
 * 
 * Claims a waste issue for the community. Only moderators can claim issues.
 * A moderator can claim an issue and mark their community as actively working on it.
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id
 * @returns Claimed issue details
 * 
 * @example
 * POST /api/community/community-uuid/claim-issue
 * {
 *   "issueId": "issue-uuid"
 * }
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Issue claimed successfully",
 *     "claimedIssue": {
 *       "id": "uuid",
 *       "communityId": "...",
 *       "issueId": "...",
 *       "claimedBy": "...",
 *       "status": "active",
 *       "claimedAt": "2024-01-07T..."
 *     }
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

    if (!body || !body.issueId) {
      return errorResponse('Issue ID is required', 400);
    }

    const issueId = body.issueId as string;

    // Check if user is a moderator in this community
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: authUser.id,
          communityId,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!userMembership) {
      return errorResponse('You are not a member of this community', 403);
    }

    if (userMembership.role !== 'moderator' && userMembership.role !== 'owner') {
      return errorResponse('Only moderators can claim issues', 403);
    }

    // Check if issue is already claimed by this community
    const existingClaim = await prisma.communityClaimedIssue.findUnique({
      where: {
        communityId_issueId: {
          communityId,
          issueId,
        },
      },
    });

    if (existingClaim) {
      if (existingClaim.status === 'active') {
        return errorResponse('This community has already claimed this issue', 409);
      }
    }

    // Claim or reactivate the issue
    const claimedIssue = existingClaim
      ? await prisma.communityClaimedIssue.update({
          where: {
            communityId_issueId: {
              communityId,
              issueId,
            },
          },
          data: {
            status: 'active',
            claimedBy: authUser.id,
            claimedAt: new Date(),
            completedAt: null,
          },
        })
      : await prisma.communityClaimedIssue.create({
          data: {
            communityId,
            issueId,
            claimedBy: authUser.id,
            status: 'active',
          },
        });

    return successResponse(
      {
        message: 'Issue claimed successfully',
        claimedIssue,
      },
      existingClaim ? 200 : 201
    );
  } catch (error) {
    console.error('Claim issue error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while claiming the issue',
      500
    );
  }
}

/**
 * DELETE /api/community/:id/claim-issue/:issueId
 * 
 * Unclaims a waste issue from the community.
 * Marks the issue as cancelled instead of deleting for audit purposes.
 * Only moderators can unclaim issues.
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id and issue id
 * @returns Success message
 * 
 * @example
 * DELETE /api/community/community-uuid/claim-issue/issue-uuid
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Issue claim cancelled"
 *   }
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; issueId: string } }
): Promise<NextResponse> {
  try {
    // Get authenticated user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized: Please log in', 401);
    }

    const { id: communityId, issueId } = params;

    if (!communityId || !issueId) {
      return errorResponse('Community ID and Issue ID are required', 400);
    }

    // Check if user is a moderator in this community
    const userMembership = await prisma.communityMember.findUnique({
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

    if (!userMembership) {
      return errorResponse('You are not a member of this community', 403);
    }

    if (userMembership.role !== 'moderator' && userMembership.role !== 'owner') {
      return errorResponse('Only moderators can unclaim issues', 403);
    }

    // Find the claimed issue
    const claimedIssue = await prisma.communityClaimedIssue.findUnique({
      where: {
        communityId_issueId: {
          communityId,
          issueId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!claimedIssue) {
      return errorResponse('This issue is not claimed by this community', 404);
    }

    // Mark as cancelled instead of deleting
    await prisma.communityClaimedIssue.update({
      where: {
        communityId_issueId: {
          communityId,
          issueId,
        },
      },
      data: { status: 'cancelled' },
    });

    return successResponse(
      { message: 'Issue claim cancelled' },
      200
    );
  } catch (error) {
    console.error('Unclaim issue error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while unclaiming the issue',
      500
    );
  }
}
