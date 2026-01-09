import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/reports/[id]/event
 * Get the active cleanup event for a report
 */
export async function GET(
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

    // Verify report exists
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return errorResponse("Report not found", 404);
    }

    // Get the most recent event for this report
    const event = await prisma.cleanupEvent.findFirst({
      where: {
        reportId,
        status: {
          in: ["scheduled", "completed"], // Don't include cancelled or disputed
        },
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        attendees: {
          include: {
            volunteer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!event) {
      return successResponse(
        {
          event: null,
          message: "No active event found for this report",
        },
        200
      );
    }

    // Calculate dispute statistics if completed
    let disputeStats = null;
    if (event.status === "completed") {
      const totalAttendees = event.attendees.length;
      const disputes = event.attendees.filter(
        (a) => a.rsvpStatus === "disputed"
      ).length;
      const disputePercentage =
        totalAttendees > 0 ? (disputes / totalAttendees) * 100 : 0;

      // Calculate time remaining in dispute window
      let hoursRemaining = null;
      if (event.markedCleanedAt) {
        const markedDate = new Date(event.markedCleanedAt);
        const hoursPassed =
          (Date.now() - markedDate.getTime()) / (1000 * 60 * 60);
        hoursRemaining = Math.max(0, 24 - hoursPassed);
      }

      disputeStats = {
        totalAttendees,
        disputes,
        disputePercentage,
        hoursRemaining,
        canDispute: hoursRemaining !== null && hoursRemaining > 0,
      };
    }

    return successResponse({
      event,
      disputeStats,
    });
  } catch (error) {
    console.error("Get report event error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
