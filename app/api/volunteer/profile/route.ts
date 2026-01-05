import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse, parseRequestBody } from "@/lib/api-utils";

/**
 * GET /api/volunteer/profile
 * Get the authenticated user's volunteer profile
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Get user with volunteer profile
    const userWithVolunteer = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        volunteer: {
          include: {
            _count: {
              select: {
                communityMembers: true,
                createdCommunities: true,
                ledEvents: true,
              },
            },
          },
        },
      },
    });

    if (!userWithVolunteer) {
      return errorResponse("User not found", 404);
    }

    // If no volunteer profile, return null (they need to create one)
    if (!userWithVolunteer.volunteer) {
      return successResponse({
        volunteer: null,
        needsProfile: true,
      });
    }

    // Return volunteer profile with stats
    return successResponse({
      volunteer: {
        id: userWithVolunteer.volunteer.id,
        name: userWithVolunteer.volunteer.name,
        email: userWithVolunteer.volunteer.email,
        createdAt: userWithVolunteer.volunteer.createdAt,
        stats: {
          communitiesJoined:
            userWithVolunteer.volunteer._count.communityMembers,
          communitiesCreated:
            userWithVolunteer.volunteer._count.createdCommunities,
          eventsLed: userWithVolunteer.volunteer._count.ledEvents,
        },
      },
      needsProfile: false,
    });
  } catch (error) {
    console.error("Get volunteer profile error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}

/**
 * PATCH /api/volunteer/profile
 * Update the authenticated user's volunteer profile
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Get user with volunteer profile
    const userWithVolunteer = await prisma.user.findUnique({
      where: { id: user.id },
      include: { volunteer: true },
    });

    if (!userWithVolunteer?.volunteer) {
      return errorResponse("Volunteer profile not found", 404);
    }

    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const { name } = body as { name?: string };

    if (!name || name.trim().length === 0) {
      return errorResponse("Name is required", 400);
    }

    // Update volunteer profile
    const updatedVolunteer = await prisma.volunteer.update({
      where: { id: userWithVolunteer.volunteer.id },
      data: {
        name: name.trim(),
      },
      include: {
        _count: {
          select: {
            communityMembers: true,
            createdCommunities: true,
            ledEvents: true,
          },
        },
      },
    });

    return successResponse(
      {
        volunteer: {
          id: updatedVolunteer.id,
          name: updatedVolunteer.name,
          email: updatedVolunteer.email,
          createdAt: updatedVolunteer.createdAt,
          stats: {
            communitiesJoined: updatedVolunteer._count.communityMembers,
            communitiesCreated: updatedVolunteer._count.createdCommunities,
            eventsLed: updatedVolunteer._count.ledEvents,
          },
        },
      },
      200,
      "Profile updated successfully"
    );
  } catch (error) {
    console.error("Update volunteer profile error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
