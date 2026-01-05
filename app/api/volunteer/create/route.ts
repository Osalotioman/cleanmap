import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateRequiredFields,
} from "@/lib/api-utils";

interface CreateVolunteerRequest {
  name: string;
}

/**
 * POST /api/volunteer/create
 * Convert existing user to volunteer
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

    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validation = validateRequiredFields(body, ["name"]);
    if (!validation.isValid) {
      return errorResponse(validation.error!, 400);
    }

    const { name } = body as unknown as CreateVolunteerRequest;

    // Check if user already has volunteer profile
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { volunteer: true },
    });

    if (!existingUser) {
      return errorResponse("User not found", 404);
    }

    if (existingUser.volunteer) {
      return errorResponse("User already has a volunteer profile", 409);
    }

    // Create volunteer profile
    const volunteer = await prisma.volunteer.create({
      data: {
        name,
        email: existingUser.email,
      },
    });

    // Link volunteer to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        volunteerId: volunteer.id,
        role: "volunteer",
      },
    });

    return successResponse(
      { volunteer },
      201,
      "Volunteer profile created successfully"
    );
  } catch (error) {
    console.error("Create volunteer error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
