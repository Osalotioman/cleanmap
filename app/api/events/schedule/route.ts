import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  errorResponse,
  parseRequestBody,
  successResponse,
  validateRequiredFields,
} from "@/lib/api-utils";

interface ScheduleEventRequest {
  reportId: string;
  communityId: string;
  scheduledAt: string;
}

/**
 * POST /api/events/schedule
 * Schedule a cleanup event for a report
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
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

    const validation = validateRequiredFields(body, [
      "reportId",
      "communityId",
      "scheduledAt",
    ]);
    if (!validation.isValid) {
      return errorResponse(validation.error!, 400);
    }

    const { reportId, communityId, scheduledAt } =
      body as unknown as ScheduleEventRequest;

    // Verify membership
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_volunteerId: {
          communityId,
          volunteerId: userWithVolunteer.volunteer.id,
        },
      },
    });

    if (!membership) {
      return errorResponse("Not a member of this community", 403);
    }

    // Check if report exists and is pending
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return errorResponse("Report not found", 404);
    }

    if (report.status !== "pending") {
      return errorResponse("Report already scheduled or cleaned", 409);
    }

    // Create event
    const event = await prisma.cleanupEvent.create({
      data: {
        communityId,
        reportId,
        leaderId: userWithVolunteer.volunteer.id,
        scheduledAt: new Date(scheduledAt),
        status: "scheduled",
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Auto-RSVP the leader
    await prisma.eventAttendee.create({
      data: {
        eventId: event.id,
        volunteerId: userWithVolunteer.volunteer.id,
        rsvpStatus: "attending",
      },
    });

    // Update report status
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "scheduled" },
    });

    return successResponse(
      { event },
      201,
      "Cleanup event scheduled successfully"
    );
  } catch (error) {
    console.error("Schedule event error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}



