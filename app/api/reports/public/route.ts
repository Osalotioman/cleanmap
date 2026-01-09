import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterByRadius } from "@/lib/geospatial";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/reports/public?lat=<lat>&lon=<lon>&radius=<radius>
 * Get public reports within a radius (default 5km)
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lon = parseFloat(searchParams.get("lon") || "");
    const radius = parseInt(searchParams.get("radius") || "5000"); // Default 5km

    if (isNaN(lat) || isNaN(lon)) {
      return errorResponse("Valid latitude and longitude required", 400);
    }

    // Get all pending reports (we'll filter by radius in-memory for MVP)
    const reports = await prisma.report.findMany({
      where: {
        status: {
          in: ["pending", "scheduled"],
        },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        description: true,
        imageUrl: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter by radius and add distance
    const nearbyReports = filterByRadius(reports, lat, lon, radius);

    return successResponse({
      reports: nearbyReports,
      count: nearbyReports.length,
    });
  } catch (error) {
    console.error("Get public reports error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
