import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Total reports count
    const { count: totalReports } = await supabase
      .from("waste_reports")
      .select("*", { count: "exact", head: true });

    // Pending reports (reported + acknowledged)
    const { count: pendingReports } = await supabase
      .from("waste_reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["reported", "acknowledged"]);

    // Cleaned reports
    const { count: cleanedReports } = await supabase
      .from("waste_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "cleaned");

    // Reports by status
    const { data: statusBreakdown } = await supabase
      .from("waste_reports")
      .select("status");

    const statusCounts = statusBreakdown?.reduce((acc: any, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {});

    // Reports by issue type
    const { data: typeBreakdown } = await supabase
      .from("waste_reports")
      .select("issue_type");

    const typeCounts = typeBreakdown?.reduce((acc: any, report) => {
      acc[report.issue_type] = (acc[report.issue_type] || 0) + 1;
      return acc;
    }, {});

    // Recent reports (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentReports } = await supabase
      .from("waste_reports")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    // Hotspots (reports with 3+ votes or multiple reports in same area)
    const { data: highVoteReports } = await supabase
      .from("waste_reports")
      .select(
        `
        id,
        issue_type,
        status,
        location,
        vote_count:report_votes(count)
      `
      )
      .eq("status", "reported");

    const hotspots =
      highVoteReports
        ?.filter((report: any) => report.vote_count?.[0]?.count >= 3)
        .map((report: any) => ({
          id: report.id,
          issue_type: report.issue_type,
          votes: report.vote_count[0].count,
          latitude: report.location?.coordinates?.[1],
          longitude: report.location?.coordinates?.[0],
        })) || [];

    return NextResponse.json({
      stats: {
        total_reports: totalReports || 0,
        pending_reports: pendingReports || 0,
        cleaned_reports: cleanedReports || 0,
        recent_reports: recentReports || 0,
        status_breakdown: statusCounts || {},
        type_breakdown: typeCounts || {},
        hotspots: hotspots.length,
        hotspot_details: hotspots,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
