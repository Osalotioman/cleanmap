import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/reports/[id]/vote - Upvote a report (mark as duplicate/important)
export async function POST(
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

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("report_votes")
      .select("id")
      .eq("user_id", user.id)
      .eq("report_id", id)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this report" },
        { status: 400 }
      );
    }

    // Create vote
    const { data, error } = await supabase
      .from("report_votes")
      .insert({
        user_id: user.id,
        report_id: id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to vote", details: error.message },
        { status: 500 }
      );
    }

    // Get updated vote count
    const { count } = await supabase
      .from("report_votes")
      .select("*", { count: "exact", head: true })
      .eq("report_id", id);

    return NextResponse.json(
      {
        vote: data,
        vote_count: count || 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id]/vote - Remove vote
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

    // Delete vote
    const { error } = await supabase
      .from("report_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("report_id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove vote", details: error.message },
        { status: 500 }
      );
    }

    // Get updated vote count
    const { count } = await supabase
      .from("report_votes")
      .select("*", { count: "exact", head: true })
      .eq("report_id", id);

    return NextResponse.json({
      message: "Vote removed",
      vote_count: count || 0,
    });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
