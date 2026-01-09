import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { calculateDistance, isValidCoordinates } from "@/lib/geospatial";
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateRequiredFields,
} from "@/lib/api-utils";

interface CheckConflictRequest {
  latitude: number;
  longitude: number;
}

/**
 * POST /api/communities/check-conflict
 * Check if a location conflicts with existing communities (2km rule)
 */
export async function POST(request: Request): Promise<NextResponse> {
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

    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validation = validateRequiredFields(body, ["latitude", "longitude"]);
    if (!validation.isValid) {
      return errorResponse(validation.error!, 400);
    }

    const { latitude, longitude } = body as unknown as CheckConflictRequest;

    // Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
      return errorResponse("Invalid coordinates", 400);
    }

    // Get all communities
    const existingCommunities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        centerLat: true,
        centerLon: true,
      },
    });

    // Check for conflicts within 2km
    const conflicts = existingCommunities
      .map((community) => ({
        ...community,
        distance: calculateDistance(
          latitude,
          longitude,
          community.centerLat,
          community.centerLon
        ),
      }))
      .filter((community) => community.distance <= 2000)
      .sort((a, b) => a.distance - b.distance);

    if (conflicts.length > 0) {
      const nearestConflict = conflicts[0];
      return successResponse({
        hasConflict: true,
        conflict: {
          id: nearestConflict.id,
          name: nearestConflict.name,
          distance: nearestConflict.distance,
        },
      });
    }

    return successResponse({
      hasConflict: false,
    });
  } catch (error) {
    console.error("Check conflict error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
