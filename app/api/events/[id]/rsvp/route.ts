import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

/**
 * POST /api/events/[id]/rsvp
 * RSVP to a cleanup event
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

    // Check if event exists
    const event = await prisma.cleanupEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    if (event.status !== "scheduled") {
      return errorResponse("Event is not available for RSVP", 409);
    }

    // Check if already RSVP'd
    const existingRsvp = await prisma.eventAttendee.findUnique({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId: userWithVolunteer.volunteer.id,
        },
      },
    });

    if (existingRsvp) {
      return errorResponse("Already RSVP'd to this event", 409);
    }

    // Create RSVP
    await prisma.eventAttendee.create({
      data: {
        eventId,
        volunteerId: userWithVolunteer.volunteer.id,
        rsvpStatus: "attending",
      },
    });

    return successResponse({ eventId }, 200, "RSVP successful");
  } catch (error) {
    console.error("RSVP error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}