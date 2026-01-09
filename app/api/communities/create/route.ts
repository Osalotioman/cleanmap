import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  calculateDistance,
  generateCommunityName,
  isValidCoordinates,
} from "@/lib/geospatial";
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateRequiredFields,
} from "@/lib/api-utils";

interface CreateCommunityRequest {
  latitude: number;
  longitude: number;
  name?: string; // Optional, will be auto-generated if not provided
}

/**
 * POST /api/communities/create
 * Create a new community (2km radius rule applies)
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

    const { latitude, longitude, name } =
      body as unknown as CreateCommunityRequest;

    // Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
      return errorResponse("Invalid coordinates", 400);
    }

    // Check for conflicts (2km radius rule)
    const existingCommunities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        centerLat: true,
        centerLon: true,
      },
    });

    const conflicts = existingCommunities.filter((community) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        community.centerLat,
        community.centerLon
      );
      return distance <= 2000; // 2km in meters
    });

    if (conflicts.length > 0) {
      const nearest = conflicts[0];
      const distance = calculateDistance(
        latitude,
        longitude,
        nearest.centerLat,
        nearest.centerLon
      );

      return errorResponse(
        `A community already exists here: ${nearest.name} (${Math.round(distance)}m away). Join them instead!`,
        409,
        { existingCommunity: nearest }
      );
    }

    // Generate name and state if not provided
    let communityName = name;
    let state = "";

    if (!communityName) {
      const generated = await generateCommunityName(latitude, longitude);
      communityName = generated.name;
      state = generated.state;
    } else {
      // Still need to get state for filtering
      const generated = await generateCommunityName(latitude, longitude);
      state = generated.state;
    }

    // Create community
    const community = await prisma.community.create({
      data: {
        name: communityName,
        state,
        centerLat: latitude,
        centerLon: longitude,
        radius: 2000,
        createdBy: userWithVolunteer.volunteer.id,
      },
      include: {
        creator: true,
      },
    });

    // Auto-join the creator
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        volunteerId: userWithVolunteer.volunteer.id,
      },
    });

    return successResponse(
      { community },
      201,
      "Community created successfully"
    );
  } catch (error) {
    console.error("Create community error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
