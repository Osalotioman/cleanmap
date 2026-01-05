import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { calculateDistance, filterByRadius } from "@/lib/geospatial";

/**
 * GET /api/communities/[id]/reports
 * Get reports for a community (core + buffer zone)
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

    // Verify membership
    const userWithVolunteer = await prisma.user.findUnique({
      where: { id: user.id },
      include: { volunteer: true },
    });

    if (!userWithVolunteer?.volunteer) {
      return errorResponse("Volunteer profile required", 403);
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_volunteerId: {
          communityId,
          volunteerId: userWithVolunteer.volunteer.id,
        },
      },
    });

    if (!membership) {
      return errorResponse("Not a member of this community", 403);
    }

    // Get community details
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return errorResponse("Community not found", 404);
    }

    // Get all pending/scheduled reports
    const allReports = await prisma.report.findMany({
      where: {
        status: {
          in: ["pending", "scheduled"],
        },
      },
      include: {
        events: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                attendees: true,
              },
            },
          },
        },
        comments: {
          include: {
            volunteer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Filter core reports (within 2km)
    const coreReports = filterByRadius(
      allReports,
      community.centerLat,
      community.centerLon,
      2000
    );

    // Filter buffer reports (2km - 2.5km)
    const bufferReports = allReports
      .map((report) => ({
        ...report,
        distance: calculateDistance(
          community.centerLat,
          community.centerLon,
          report.latitude,
          report.longitude
        ),
      }))
      .filter((report) => report.distance > 2000 && report.distance <= 2500)
      .sort((a, b) => a.distance - b.distance);

    return successResponse({
      coreReports,
      bufferReports,
      community: {
        id: community.id,
        name: community.name,
        centerLat: community.centerLat,
        centerLon: community.centerLon,
      },
    });
  } catch (error) {
    console.error("Get community reports error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
