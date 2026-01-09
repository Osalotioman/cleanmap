/**
 * Join Request Management API Route
 * 
 * DELETE /api/community/join-request/:id - Cancel join request
 * PATCH /api/community/join-request/:id - Approve/Reject join request (moderator only)
 * 
 * @module app/api/community/join-request/[id]
 */

import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-utils';

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
): Promise<NextResponse> {
  try {
    return errorResponse(
      'Community join requests are not supported by the current Prisma client/schema. Please run migrations/regenerate Prisma or remove this endpoint.',
      501
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
): Promise<NextResponse> {
  try {
    return errorResponse(
      'Community join requests are not supported by the current Prisma client/schema. Please run migrations/regenerate Prisma or remove this endpoint.',
      501
    );
  } catch (error) {
    console.error('Respond to join request error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while responding to join request',
      500
    );
  }
}
