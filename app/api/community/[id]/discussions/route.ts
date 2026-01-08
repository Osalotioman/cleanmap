/**
 * Community Discussions API Route
 * 
 * GET /api/community/:id/discussions - Get discussion messages
 * POST /api/community/:id/discussions - Post a new discussion message
 * 
 * @module app/api/community/[id]/discussions
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, parseRequestBody } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/supabase/server';

/**
 * GET /api/community/:id/discussions
 * 
 * Fetches discussion messages for a community.
 * Messages are ordered by creation date (newest first).
 * Results are paginated.
 * 
 * Query Parameters:
 * - limit: Maximum results to return (default: 50)
 * - offset: Pagination offset (default: 0)
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id
 * @returns Array of discussion messages with pagination info
 * 
 * @example
 * GET /api/community/community-uuid/discussions?limit=20&offset=0
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "messages": [
 *       {
 *         "id": "uuid",
 *         "communityId": "...",
 *         "userId": "...",
 *         "message": "Let's organize a cleanup next Saturday!",
 *         "createdAt": "2024-01-07T...",
 *         "updatedAt": "2024-01-07T...",
 *         "user": {
 *           "id": "...",
 *           "firstName": "John",
 *           "lastName": "Doe",
 *           "email": "..."
 *         }
 *       }
 *     ],
 *     "pagination": {
 *       "total": 150,
 *       "hasMore": true
 *     }
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
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

    // Fetch messages
    const messages = await prisma.communityDiscussion.findMany({
      where: { communityId },
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
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.communityDiscussion.count({
      where: { communityId },
    });

    const hasMore = offset + limit < total;

    return successResponse(
      {
        messages,
        pagination: {
          total,
          hasMore,
        },
      },
      200
    );
  } catch (error) {
    console.error('Get discussions error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching discussions',
      500
    );
  }
}

/**
 * POST /api/community/:id/discussions
 * 
 * Posts a new discussion message to the community.
 * Only authenticated community members can post messages.
 * 
 * @param request - Next.js Request object
 * @param params - Route parameters containing community id
 * @returns Created discussion message
 * 
 * @example
 * POST /api/community/community-uuid/discussions
 * {
 *   "message": "Let's organize a cleanup next Saturday!"
 * }
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Discussion posted successfully",
 *     "discussion": {...}
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

    if (!body || !body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return errorResponse('Message cannot be empty', 400);
    }

    const message = body.message as string;
    if (message.length > 5000) {
      return errorResponse('Message must be less than 5000 characters', 400);
    }

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    });

    if (!community) {
      return errorResponse('Community not found', 404);
    }

    // Check if user is a member of the community
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: authUser.id,
          communityId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return errorResponse('Only community members can post discussions', 403);
    }

    // Create discussion message
    const discussion = await prisma.communityDiscussion.create({
      data: {
        communityId,
        userId: authUser.id,
        message: message.trim(),
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

    return successResponse(
      {
        message: 'Discussion posted successfully',
        discussion,
      },
      201
    );
  } catch (error) {
    console.error('Post discussion error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while posting discussion',
      500
    );
  }
}
