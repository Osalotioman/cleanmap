import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { isValidCoordinates } from "@/lib/geospatial";
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateRequiredFields,
} from "@/lib/api-utils";

interface SubmitReportRequest {
  latitude: number;
  longitude: number;
  description?: string;
  imageUrl?: string;
  deviceId: string;
}

/**
 * POST /api/reports/submit
 * Submit an anonymous waste report
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validation = validateRequiredFields(body, [
      "latitude",
      "longitude",
      "deviceId",
    ]);
    if (!validation.isValid) {
      return errorResponse(validation.error!, 400);
    }

    const { latitude, longitude, description, imageUrl, deviceId } =
      body as unknown as SubmitReportRequest;

    // Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
      return errorResponse("Invalid coordinates", 400);
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(deviceId);
    if (!rateLimitCheck.canSubmit) {
      return errorResponse(
        `Daily limit reached. You can submit ${rateLimitCheck.remaining} more report(s). Limit resets at ${rateLimitCheck.resetAt.toISOString()}`,
        429
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        latitude,
        longitude,
        description: description || null,
        imageUrl: imageUrl || null,
        deviceId,
        status: "pending",
      },
    });

    return successResponse(
      {
        report,
        rateLimitRemaining: rateLimitCheck.remaining - 1,
      },
      201,
      "Report submitted successfully"
    );
  } catch (error) {
    console.error("Submit report error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
