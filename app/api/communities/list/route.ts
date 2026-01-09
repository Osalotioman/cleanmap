import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { calculateDistance, reverseGeocode } from "@/lib/geospatial";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/communities/list
 * 
 * Supported query modes:
 * - Geo mode (recommended): ?lat=<lat>&lon=<lon>
 *   Computes currentState via reverse geocoding, returns distance sorted.
 * - Filter mode: ?state=<state>&search=<term>
 *   Useful for basic search/filter UIs and pages that don't have coordinates.
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

    const rawLat = searchParams.get("lat");
    const rawLon = searchParams.get("lon");
    const lat = rawLat ? parseFloat(rawLat) : null;
    const lon = rawLon ? parseFloat(rawLon) : null;

    const stateFilter = (searchParams.get("state") || "").trim();
    const search = (searchParams.get("search") || "").trim();

    const hasGeo = lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);

    // Determine state: prefer explicit filter, otherwise infer from geo.
    let currentState = stateFilter;
    if (!currentState && hasGeo) {
      const location = await reverseGeocode(lat!, lon!);
      currentState = (location.state || "").trim();
    }

    // Get communities (optionally filtered by state and/or name search)
    const communities = await prisma.community.findMany({
      where: {
        ...(currentState ? { state: currentState } : {}),
        ...(search
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {}),
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

    // Calculate distances only when we have geo coordinates.
    const communitiesWithDistance = hasGeo
      ? communities
          .map((community) => ({
            ...community,
            distance: calculateDistance(
              lat!,
              lon!,
              community.centerLat,
              community.centerLon
            ),
          }))
          .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      : communities;

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
