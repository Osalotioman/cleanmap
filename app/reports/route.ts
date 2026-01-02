import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/reports - Fetch all reports with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Optional filters from query params
    const status = searchParams.get("status");
    const issueType = searchParams.get("issue_type");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabase
      .from("waste_reports")
      .select(
        `
        *,
        users:user_id (
          display_name,
          email
        ),
        vote_count:report_votes(count)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }
    if (issueType) {
      query = query.eq("issue_type", issueType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch reports", details: error.message },
        { status: 500 }
      );
    }

    // Transform PostGIS point to lat/lng
    const reports = data?.map((report) => ({
      ...report,
      latitude: report.location?.coordinates?.[1] || null,
      longitude: report.location?.coordinates?.[0] || null,
      vote_count: report.vote_count?.[0]?.count || 0,
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new waste report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { issue_type, latitude, longitude, description, photo_url } = body;

    // Validate required fields
    if (!issue_type || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields: issue_type, latitude, longitude" },
        { status: 400 }
      );
    }

    // Validate issue type
    const validIssueTypes = [
      "overflowing_bin",
      "illegal_dump",
      "blocked_drain",
      "litter",
      "other",
    ];
    if (!validIssueTypes.includes(issue_type)) {
      return NextResponse.json(
        { error: "Invalid issue_type" },
        { status: 400 }
      );
    }

    // Create PostGIS point (longitude first, then latitude)
    const locationPoint = `POINT(${longitude} ${latitude})`;

    // Insert the report
    const { data, error } = await supabase
      .from("waste_reports")
      .insert({
        user_id: user.id,
        issue_type,
        location: locationPoint,
        description: description || null,
        photo_url: photo_url || null,
        status: "reported",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create report", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
