import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/reports/[id] - Get single report details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data, error } = await supabase
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
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Transform PostGIS point
    const report = {
      ...data,
      latitude: data.location?.coordinates?.[1] || null,
      longitude: data.location?.coordinates?.[0] || null,
      vote_count: data.vote_count?.[0]?.count || 0,
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[id] - Update report status (volunteers/admins)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check authentication
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

    // Check if user is volunteer or admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!["volunteer", "admin"].includes(userData.role)) {
      return NextResponse.json(
        { error: "Only volunteers and admins can update report status" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["reported", "acknowledged", "cleaned"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update the report
    const { data, error } = await supabase
      .from("waste_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update report", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ report: data });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete report (admin or owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check authentication
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

    // Get report to check ownership
    const { data: report, error: reportError } = await supabase
      .from("waste_reports")
      .select("user_id")
      .eq("id", id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check if user is owner or admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = report.user_id === user.id;
    const isAdmin = userData?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to delete this report" },
        { status: 403 }
      );
    }

    // Delete the report
    const { error } = await supabase
      .from("waste_reports")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete report", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
