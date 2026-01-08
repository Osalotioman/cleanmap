/**
 * Send Join Request API Route
 * 
 * POST /api/community/join-request
 * Sends a join request to a community
 * 
 * @module app/api/community/join-request
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateRequiredFields,
} from '@/lib/api-utils';
import { JoinRequestResponse } from '@/types/community';
import { getAuthUser } from '@/lib/supabase/server';

/**
 * Request body for joining a community
 */
interface SendJoinRequestBody {
  communityId: string;
  message?: string;
}

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
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized: Please log in to join a community', 401);
    }

    // Parse request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    // Validate required fields
    const requiredValidation = validateRequiredFields(body, ['communityId']);
    if (!requiredValidation.isValid) {
      return errorResponse(requiredValidation.error!, 400);
    }

    const { communityId, message } = body as unknown as SendJoinRequestBody;

    // Validate community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    });

    if (!community) {
      return errorResponse('Community not found', 404);
    }

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: authUser.id,
          communityId,
        },
      },
    });

    if (existingMembership) {
      return errorResponse('You are already a member of this community', 409);
    }

    // Check if user has a pending join request
    const existingRequest = await prisma.communityJoinRequest.findUnique({
      where: {
        userId_communityId: {
          userId: authUser.id,
          communityId,
        },
      },
    });

    if (existingRequest && existingRequest.status === 'pending') {
      return errorResponse('You have already sent a join request to this community', 409);
    }

    // Create join request
    const joinRequest = await prisma.communityJoinRequest.create({
      data: {
        userId: authUser.id,
        communityId,
        status: 'pending',
        message: message?.trim(),
      },
      select: {
        id: true,
        userId: true,
        communityId: true,
        status: true,
        message: true,
        requestedAt: true,
        respondedAt: true,
      },
    });

    return successResponse<JoinRequestResponse>(
      { joinRequest },
      201
    );
  } catch (error) {
    console.error('Send join request error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An error occurred while sending join request',
      500
    );
  }
}
