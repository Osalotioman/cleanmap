import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateRequiredFields,
} from "@/lib/api-utils";

/**
 * GET /api/reports/[id]/comments
 * Get comments for a report
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: reportId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const comments = await prisma.comment.findMany({
      where: { reportId },
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
    });

    return successResponse({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}

interface AddCommentRequest {
  text: string;
}

/**
 * POST /api/reports/[id]/comments
 * Add a comment to a report
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: reportId } = await params;

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

    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validation = validateRequiredFields(body, ["text"]);
    if (!validation.isValid) {
      return errorResponse(validation.error!, 400);
    }

    const { text } = body as unknown as AddCommentRequest;

    if (text.trim().length === 0) {
      return errorResponse("Comment text cannot be empty", 400);
    }

    // Verify report exists
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return errorResponse("Report not found", 404);
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        reportId,
        volunteerId: userWithVolunteer.volunteer.id,
        text: text.trim(),
      },
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse({ comment }, 201, "Comment added successfully");
  } catch (error) {
    console.error("Add comment error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
