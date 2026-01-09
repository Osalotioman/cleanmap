/**
 * Get Community Issues API Route
 * 
 * GET /api/community/:id/issues
 * Fetches issues claimed by a community (both active and completed)
 * 
 * @module app/api/community/[id]/issues
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-utils';

/**
 * GET /api/community/:id/issues
 * 
 * Fetches all issues claimed by a community.
 * Returns both active issues (currently being worked on) and completed issues.
 * Results are paginated and sorted by status (active first) and then by claimed date.
 * 
 * Query Parameters:
 * - status: Filter by status ('active', 'completed', 'cancelled') - optional, returns all if not specified
 * - limit: Maximum results to return (default: 50)
 * - offset: Pagination offset (default: 0)
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id
 * @returns Array of claimed issues with pagination info
 * 
 * @example
 * GET /api/community/community-uuid/issues?status=active&limit=20
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "activeIssues": [
 *       {
 *         "id": "uuid",
 *         "communityId": "...",
 *         "issueId": "issue-uuid",
 *         "claimedBy": "user-uuid",
 *         "status": "active",
 *         "claimedAt": "2024-01-07T...",
 *         "completedAt": null,
 *         "claimedByUser": {...}
 *       }
 *     ],
 *     "completedIssues": [
 *       {
 *         "id": "uuid",
 *         "communityId": "...",
 *         "issueId": "issue-uuid",
 *         "claimedBy": "user-uuid",
 *         "status": "completed",
 *         "claimedAt": "2024-01-05T...",
 *         "completedAt": "2024-01-07T...",
 *         "claimedByUser": {...}
 *       }
 *     ],
 *     "pagination": {
 *       "total": 15,
 *       "activeCount": 5,
 *       "completedCount": 10
 *     }
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: communityId } = await params;

    if (!communityId) {
      return errorResponse('Community ID is required', 400);
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    });

    if (!community) {
      return errorResponse('Community not found', 404);
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      communityId,
      status: { not: 'cancelled' }, // Don't return cancelled by default
    };

    if (status && ['active', 'completed', 'cancelled'].includes(status)) {
      whereClause.status = status;
    }

    // Fetch active and completed issues separately
    const activeIssues = await prisma.communityClaimedIssue.findMany({
      where: {
        communityId,
        status: status && status !== 'completed' ? status : 'active',
      },
      include: {
        claimedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ claimedAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    const completedIssues = await prisma.communityClaimedIssue.findMany({
      where: {
        communityId,
        status: 'completed',
      },
      include: {
        claimedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ resolvedAt: 'desc' }],
    });

    // Get counts
    const activeCount = await prisma.communityClaimedIssue.count({
      where: {
        communityId,
        status: 'active',
      },
    });

    const completedCount = await prisma.communityClaimedIssue.count({
      where: {
        communityId,
        status: 'completed',
      },
    });

    const total = activeCount + completedCount;

    return successResponse(
      {
        activeIssues,
        completedIssues,
        pagination: {
          total,
          activeCount,
          completedCount,
        },
      },
      200
    );
  } catch (error) {
    console.error('Get community issues error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching community issues',
      500
    );
  }
}

/**
 * PATCH /api/community/:id/issues/:issueId
 * 
 * Marks a claimed issue as completed.
 * Only moderators can mark issues as completed.
 * 
 * @example
 * PATCH /api/community/community-uuid/issues/issue-uuid
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: communityId } = await params;
    
    // Get issueId from URL search params
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issueId');

    if (!communityId || !issueId) {
      return errorResponse('Community ID and Issue ID are required', 400);
    }

    // Find the claimed issue
    const claimedIssue = await prisma.communityClaimedIssue.findUnique({
      where: {
        communityId_issueId: {
          communityId,
          issueId,
        },
      },
    });

    if (!claimedIssue) {
      return errorResponse('Issue is not claimed by this community', 404);
    }

    if (claimedIssue.status !== 'active') {
      return errorResponse('Only active issues can be marked as completed', 409);
    }

    // Mark as completed
    const updatedIssue = await prisma.communityClaimedIssue.update({
      where: {
        communityId_issueId: {
          communityId,
          issueId,
        },
      },
      data: {
        status: 'completed',
        resolvedAt: new Date(),
      },
      include: {
        claimedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return successResponse(
      {
        message: 'Issue marked as completed',
        issue: updatedIssue,
      },
      200
    );
  } catch (error) {
    console.error('Complete issue error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while completing the issue',
      500
    );
  }
}
