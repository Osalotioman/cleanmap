import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

/**
 * POST /api/events/[id]/dispute
 * Dispute a cleanup completion
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

    if (event.status !== "completed") {
      return errorResponse("Event is not in completed state", 409);
    }

    // Check if within 24-hour window
    if (event.markedCleanedAt) {
      const hoursSinceCompletion =
        (Date.now() - event.markedCleanedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCompletion > 24) {
        return errorResponse("Dispute window has closed", 409);
      }
    }

    // Update attendee dispute status
    await prisma.eventAttendee.update({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId: userWithVolunteer.volunteer.id,
        },
      },
      data: {
        rsvpStatus: "disputed",
      },
    });

    // Recalculate consensus
    const updatedEvent = await prisma.cleanupEvent.findUnique({
      where: { id: eventId },
      include: {
        attendees: true,
      },
    });

    if (updatedEvent) {
      const totalAttendees = updatedEvent.attendees.length;
      const disputes = updatedEvent.attendees.filter(
        (a) => a.rsvpStatus === "disputed"
      ).length;
      const disputePercentage = (disputes / totalAttendees) * 100;

      // If dispute percentage >= 20%, revert report to pending
      if (disputePercentage >= 20) {
        await prisma.report.update({
          where: { id: updatedEvent.reportId },
          data: { status: "pending" },
        });

        await prisma.cleanupEvent.update({
          where: { id: eventId },
          data: { status: "disputed" },
        });

        return successResponse(
          { eventId, reportReverted: true },
          200,
          "Dispute recorded. Report reverted to pending status."
        );
      }
    }

    return successResponse(
      { eventId, reportReverted: false },
      200,
      "Dispute recorded"
    );
  } catch (error) {
    console.error("Dispute event error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
