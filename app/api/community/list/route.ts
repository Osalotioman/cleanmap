/**
 * Fetch Communities API Route
 * 
 * GET /api/community/list
 * Fetches communities with optional filtering and user's membership status
 * 
 * @module app/api/community/list
 */

import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-utils';

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
export async function GET(): Promise<NextResponse> {
  try {
    return errorResponse(
      'Community listing is not supported by the current database schema/client (expected legacy fields like description/location/coverageType/status/memberCount and join requests). Please reconcile the API with prisma/schema.prisma.',
      501
    );
  } catch (error) {
    console.error('Fetch communities error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching communities',
      500
    );
  }
}
