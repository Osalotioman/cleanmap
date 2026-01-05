import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { calculateDistance, reverseGeocode } from "@/lib/geospatial";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/communities/list?lat=<lat>&lon=<lon>
 * List communities filtered by user's current state
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

    // Get volunteer profile
    const userWithVolunteer = await prisma.user.findUnique({
      where: { id: user.id },
      include: { volunteer: true },
    });

    if (!userWithVolunteer?.volunteer) {
      return errorResponse("Volunteer profile required", 403);
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lon = parseFloat(searchParams.get("lon") || "");

    if (isNaN(lat) || isNaN(lon)) {
      return errorResponse("Valid latitude and longitude required", 400);
    }

    // Get current state from coordinates
    const location = await reverseGeocode(lat, lon);
    const currentState = location.state || "";

    // Get all communities in the same state
    const communities = await prisma.community.findMany({
      where: {
        state: currentState,
      },
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
          },
        },
      },
    });

    // Calculate distances and sort
    const communitiesWithDistance = communities
      .map((community) => ({
        ...community,
        distance: calculateDistance(
          lat,
          lon,
          community.centerLat,
          community.centerLon
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    // Check membership status
    const communitiesWithMembership = await Promise.all(
      communitiesWithDistance.map(async (community) => {
        const membership = await prisma.communityMember.findUnique({
          where: {
            communityId_volunteerId: {
              communityId: community.id,
              volunteerId: userWithVolunteer.volunteer!.id,
            },
          },
        });

        return {
          ...community,
          isMember: !!membership,
          memberCount: community._count.members,
        };
      })
    );

    return successResponse({
      communities: communitiesWithMembership,
      currentState,
    });
  } catch (error) {
    console.error("List communities error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
