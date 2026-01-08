import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/communities/[id]
 * Get community details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: communityId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Get volunteer profile
    const userWithVolunteer = await prisma.user.findUnique({
      where: { id: user.id },
      include: { volunteer: true },
    });

    if (!userWithVolunteer?.volunteer) {
      return errorResponse("Volunteer profile required", 403);
    }

    // Fetch community
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            events: true,
          },
        },
      },
    });

    if (!community) {
      return errorResponse("Community not found", 404);
    }

    // Check membership
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_volunteerId: {
          communityId,
          volunteerId: userWithVolunteer.volunteer.id,
        },
      },
    });

    return successResponse({
      community,
      isMember: !!membership,
    });
  } catch (error) {
    console.error("Get community error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
