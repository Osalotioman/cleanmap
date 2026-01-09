import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/reports/public/[id]
 * Get a single public report by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: reportId } = await params;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        description: true,
        imageUrl: true,
        status: true,
        createdAt: true,
      },
    });

    if (!report) {
      return errorResponse("Report not found", 404);
    }

    return successResponse({
      report,
    });
  } catch (error) {
    console.error("Get public report error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
