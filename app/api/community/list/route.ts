/**
 * Fetch Communities API Route
 * 
 * GET /api/community/list
 * Fetches communities with optional filtering and user's membership status
 * 
 * @module app/api/community/list
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { CommunityWithStatus } from '@/types/community';
import { getAuthUser } from '@/lib/supabase/server';

/**
 * GET /api/community/list
 * 
 * Fetches all communities with optional filters and user's membership/request status.
 * Can be called by both authenticated and non-authenticated users.
 * 
 * Query Parameters:
 * - location: Filter by location (string)
 * - coverageType: Filter by coverage type (neighborhood|district|city)
 * - status: Filter by status (active|inactive|archived), defaults to "active"
 * - search: Search by community name or description (string)
 * - limit: Maximum results to return (default: 50)
 * - offset: Pagination offset (default: 0)
 * 
 * @example
 * GET /api/community/list?location=Downtown&coverageType=neighborhood&status=active
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "communities": [
 *       {
 *         "id": "uuid",
 *         "ownerId": "user-uuid",
 *         "name": "Downtown Cleanup",
 *         "location": "Downtown",
 *         "coverageType": "neighborhood",
 *         "status": "active",
 *         "memberCount": 5,
 *         "isMember": false,
 *         "hasJoinRequest": false,
 *         "joinRequestStatus": null,
 *         ...
 *       }
 *     ],
 *     "total": 42,
 *     "limit": 50,
 *     "offset": 0
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('location');
    const coverageType = searchParams.get('coverageType');
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get authenticated user (optional)
    const authUser = await getAuthUser(request);

    // Build filter conditions
    const where: any = {
      status: status,
    };

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (coverageType && ['neighborhood', 'district', 'city'].includes(coverageType)) {
      where.coverageType = coverageType;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Fetch communities
    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        select: {
          id: true,
          ownerId: true,
          name: true,
          description: true,
          location: true,
          coverageType: true,
          guidelines: true,
          imageUrl: true,
          status: true,
          memberCount: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.community.count({ where }),
    ]);

    // If user is authenticated, fetch their membership and join request status
    let userMemberships: any = {};
    let userJoinRequests: any = {};

    if (authUser) {
      const [memberships, joinRequests] = await Promise.all([
        prisma.communityMember.findMany({
          where: {
            userId: authUser.id,
            communityId: {
              in: communities.map((c) => c.id),
            },
          },
        }),
        prisma.communityJoinRequest.findMany({
          where: {
            userId: authUser.id,
            communityId: {
              in: communities.map((c) => c.id),
            },
            status: 'pending',
          },
        }),
      ]);

      // Index for quick lookup
      memberships.forEach((m) => {
        userMemberships[m.communityId] = m;
      });

      joinRequests.forEach((jr) => {
        userJoinRequests[jr.communityId] = jr;
      });
    }

    // Build response with user status
    const communitiesWithStatus: CommunityWithStatus[] = communities.map(
      (community) => ({
        ...community,
        userMembership: userMemberships[community.id] || null,
        userJoinRequest: userJoinRequests[community.id] || null,
        isMember: !!userMemberships[community.id],
        hasJoinRequest: !!userJoinRequests[community.id],
        joinRequestStatus: userJoinRequests[community.id]?.status || null,
      })
    );

    return successResponse(
      {
        communities: communitiesWithStatus,
        total,
        limit,
        offset,
      },
      200
    );
  } catch (error) {
    console.error('Fetch communities error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching communities',
      500
    );
  }
}
