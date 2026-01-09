/**
 * Send Join Request API Route
 * 
 * POST /api/community/join-request
 * Sends a join request to a community
 * 
 * @module app/api/community/join-request
 */

import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-utils';

/**
 * POST /api/community/join-request
 * 
 * Sends a join request to a community. User must be authenticated.
 * Returns error if user is already a member or has a pending request.
 * 
 * @param request - Next.js Request object
 * @returns Created join request
 * 
 * @example
 * POST /api/community/join-request
 * {
 *   "communityId": "community-uuid",
 *   "message": "I'd like to join this cleanup effort!"
 * }
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "joinRequest": {
 *       "id": "uuid",
 *       "userId": "user-uuid",
 *       "communityId": "community-uuid",
 *       "status": "pending",
 *       "message": "I'd like to join...",
 *       "requestedAt": "2024-01-01T00:00:00Z",
 *       "respondedAt": null
 *     }
 *   }
 * }
 */
export async function POST(): Promise<NextResponse> {
  try {
    return errorResponse(
      'Community join requests are not supported by the current Prisma client/schema. Please run migrations/regenerate Prisma or remove this endpoint.',
      501
    );
  } catch (error) {
    console.error('Send join request error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while sending join request',
      500
    );
  }
}
