import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * POST /api/communities/[id]/join
 * Join a community
 */
export async function POST(
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

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return errorResponse("Community not found", 404);
    }

    // Check if already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_volunteerId: {
          communityId,
          volunteerId: userWithVolunteer.volunteer.id,
        },
      },
    });

    if (existingMembership) {
      return errorResponse("Already a member of this community", 409);
    }

    // Join community
    await prisma.communityMember.create({
      data: {
        communityId,
        volunteerId: userWithVolunteer.volunteer.id,
      },
    });

    return successResponse(
      { communityId },
      200,
      "Successfully joined community"
    );
  } catch (error) {
    console.error("Join community error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}

