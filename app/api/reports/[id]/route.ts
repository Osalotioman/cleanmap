import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/reports/[id]
 * Get a single report by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: reportId } = await params;

    // Get authenticated user (optional - public reports can be viewed by anyone)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch report with related data
    const report = await prisma.report.findUnique({
      where: { id: reportId },
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
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get most recent event
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

    if (!report) {
      return errorResponse("Report not found", 404);
    }

    return successResponse({
      report,
      isAuthenticated: !!user,
    });
  } catch (error) {
    console.error("Get report error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}

/**
 * PATCH /api/reports/[id]
 * Update a report (admin/volunteer only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: reportId } = await params;

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

    const body = await request.json();
    const { status, description } = body;

    // Validate status transitions
    const validStatuses = ["pending", "scheduled", "cleaned"];
    if (status && !validStatuses.includes(status)) {
      return errorResponse("Invalid status", 400);
    }

    // Update report
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...(status && { status }),
        ...(description !== undefined && { description }),
      },
    });

    return successResponse(
      { report: updatedReport },
      200,
      "Report updated successfully"
    );
  } catch (error) {
    console.error("Update report error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * Delete a report (admin only - for MVP, not implemented)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: reportId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user is admin (for future implementation)
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (userRecord?.role !== "admin") {
      return errorResponse("Admin access required", 403);
    }

    // Delete report (cascades to comments, events)
    await prisma.report.delete({
      where: { id: reportId },
    });

    return successResponse({ reportId }, 200, "Report deleted successfully");
  } catch (error) {
    console.error("Delete report error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
