import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

/**
 * POST /api/events/[id]/complete
 * Mark event as completed (starts dispute window)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: eventId } = await params;

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

    // Get event
    const event = await prisma.cleanupEvent.findUnique({
      where: { id: eventId },
      include: {
        attendees: true,
      },
    });

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    // Only leader can mark as complete
    if (event.leaderId !== userWithVolunteer.volunteer.id) {
      return errorResponse("Only event leader can mark as complete", 403);
    }

    if (event.status !== "scheduled") {
      return errorResponse("Event is not in scheduled state", 409);
    }

    // Update event
    await prisma.cleanupEvent.update({
      where: { id: eventId },
      data: {
        status: "completed",
        markedCleanedAt: new Date(),
      },
    });

    // Check 80% consensus rule
    const totalAttendees = event.attendees.length;
    const disputes = event.attendees.filter(
      (a) => a.rsvpStatus === "disputed"
    ).length;
    const disputePercentage = (disputes / totalAttendees) * 100;

    // If single volunteer or dispute < 20%, mark report as cleaned
    if (totalAttendees === 1 || disputePercentage < 20) {
      await prisma.report.update({
        where: { id: event.reportId },
        data: { status: "cleaned" },
      });

      return successResponse(
        { eventId, reportCleaned: true },
        200,
        "Event completed and report marked as cleaned"
      );
    }

    return successResponse(
      { eventId, reportCleaned: false, disputeWindow: "24 hours" },
      200,
      "Event marked as completed. 24-hour dispute window started."
    );
  } catch (error) {
    console.error("Complete event error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
