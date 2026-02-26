import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { reviewContent } from "@/lib/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scriptId, script, platform } = body;

    if (!script || !platform) {
      return NextResponse.json(
        { error: "script and platform are required" },
        { status: 400 }
      );
    }

    // Get top performing patterns for context
    const { data: topVideos } = await supabase
      .from("videos")
      .select("title, view_count, nx_avg")
      .eq("platform", platform)
      .order("nx_avg", { ascending: false })
      .limit(5);

    const patterns = topVideos?.map(
      (v) => `"${v.title}" — ${v.nx_avg}x avg performance`
    );

    const reviewResult = await reviewContent({
      script,
      platform,
      topPerformingPatterns: patterns,
    });

    // Parse review
    let review;
    try {
      review = JSON.parse(reviewResult);
    } catch {
      review = { score: 70, hook_score: 70, flags: [], suggestions: [reviewResult], strengths: [] };
    }

    // Save review
    if (scriptId) {
      await supabase.from("content_reviews").insert({
        script_id: scriptId,
        score: review.score,
        hook_score: review.hook_score,
        feedback: review,
        ai_analysis: reviewResult,
        status: "completed",
      });

      // Update script status
      await supabase
        .from("content_scripts")
        .update({ status: "in_review" })
        .eq("id", scriptId);
    }

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    console.error("Review error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to review content" },
      { status: 500 }
    );
  }
}
