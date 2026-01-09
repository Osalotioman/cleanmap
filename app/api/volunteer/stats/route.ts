import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { filterByRadius } from "@/lib/geospatial";

/**
 * GET /api/volunteer/stats?lat=<lat>&lon=<lon>
 * Get statistics for the authenticated volunteer's dashboard
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const userWithVolunteer = await prisma.user.findUnique({
      where: { id: user.id },
      include: { volunteer: true },
    });

    if (!userWithVolunteer?.volunteer) {
      return errorResponse("Volunteer profile required", 403);
    }
    const volunteerId = userWithVolunteer.volunteer.id;

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lon = parseFloat(searchParams.get("lon") || "");

    if (isNaN(lat) || isNaN(lon)) {
      return errorResponse("Valid latitude and longitude required", 400);
    }

    // 1. My Communities count
    const myCommunitiesCount = await prisma.communityMember.count({
      where: { volunteerId },
    });

    // 2. Nearby Reports count (within 5km)
    const allPendingReports = await prisma.report.findMany({
      where: { status: { in: ["pending", "scheduled"] } },
      select: { latitude: true, longitude: true },
    });
    const nearbyReportsCount = filterByRadius(allPendingReports, lat, lon, 5000).length;

    // 3. Scheduled Events count (in my communities)
    const myCommunityMemberships = await prisma.communityMember.findMany({
        where: { volunteerId },
        select: { communityId: true },
    });
    const myCommunityIds = myCommunityMemberships.map(m => m.communityId);

    const scheduledEventsCount = await prisma.cleanupEvent.count({
        where: {
            communityId: { in: myCommunityIds },
            status: 'scheduled',
        }
    });

    return successResponse({
      myCommunities: myCommunitiesCount,
      nearbyReports: nearbyReportsCount,
      scheduledEvents: scheduledEventsCount,
    });
  } catch (error) {
    console.error("Get volunteer stats error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
