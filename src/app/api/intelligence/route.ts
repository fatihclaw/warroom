import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/intelligence — fetch aggregate analytics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const accountId = searchParams.get("account_id");
    const timeRange = searchParams.get("range") || "30d";

    // Calculate date cutoff
    const now = new Date();
    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    };
    const days = daysMap[timeRange] || 99999;
    const cutoff = new Date(now.getTime() - days * 86400000).toISOString();

    // Fetch tracked accounts
    const { data: accounts, error: accErr } = await supabase
      .from("tracked_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (accErr) throw accErr;

    // Build video query
    let videoQuery = supabase
      .from("videos")
      .select("*")
      .gte("published_at", cutoff)
      .order("view_count", { ascending: false });

    if (platform && platform !== "all") {
      videoQuery = videoQuery.eq("platform", platform);
    }
    if (accountId && accountId !== "all") {
      videoQuery = videoQuery.eq("account_id", accountId);
    }

    const { data: videos, error: vidErr } = await videoQuery;
    if (vidErr) throw vidErr;

    // Compute aggregates
    const totalViews = videos?.reduce((s, v) => s + (v.view_count || 0), 0) || 0;
    const totalLikes = videos?.reduce((s, v) => s + (v.like_count || 0), 0) || 0;
    const totalComments = videos?.reduce((s, v) => s + (v.comment_count || 0), 0) || 0;
    const totalShares = videos?.reduce((s, v) => s + (v.share_count || 0), 0) || 0;
    const totalSaves = videos?.reduce((s, v) => s + (v.save_count || 0), 0) || 0;
    const avgEngagement =
      videos && videos.length > 0
        ? videos.reduce((s, v) => s + (v.engagement_rate || 0), 0) /
          videos.length
        : 0;

    // Top 3 most viral
    const topVideos = (videos || []).slice(0, 3);

    // Virality distribution
    const viralityBuckets = {
      "Below 1x": 0,
      "1x-5x": 0,
      "5x-10x": 0,
      "10x-25x": 0,
      "25x-50x": 0,
      "50x-100x": 0,
      "100x+": 0,
    };
    for (const v of videos || []) {
      const nx = v.nx_avg || 0;
      if (nx < 1) viralityBuckets["Below 1x"]++;
      else if (nx < 5) viralityBuckets["1x-5x"]++;
      else if (nx < 10) viralityBuckets["5x-10x"]++;
      else if (nx < 25) viralityBuckets["10x-25x"]++;
      else if (nx < 50) viralityBuckets["25x-50x"]++;
      else if (nx < 100) viralityBuckets["50x-100x"]++;
      else viralityBuckets["100x+"]++;
    }

    // Duration analysis
    const durationBuckets: Record<string, { totalViews: number; count: number }> = {};
    for (const v of videos || []) {
      if (!v.duration_seconds) continue;
      let bucket: string;
      const d = v.duration_seconds;
      if (d < 15) bucket = "0-15s";
      else if (d < 30) bucket = "15-30s";
      else if (d < 60) bucket = "30-60s";
      else if (d < 180) bucket = "1-3m";
      else if (d < 600) bucket = "3-10m";
      else bucket = "10m+";

      if (!durationBuckets[bucket]) {
        durationBuckets[bucket] = { totalViews: 0, count: 0 };
      }
      durationBuckets[bucket].totalViews += v.view_count || 0;
      durationBuckets[bucket].count++;
    }

    const durationAnalysis = Object.entries(durationBuckets).map(
      ([range, data]) => ({
        range,
        avgViews: Math.round(data.totalViews / data.count),
        count: data.count,
      })
    );

    return NextResponse.json({
      metrics: {
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        totalSaves,
        avgEngagement: Number(avgEngagement.toFixed(2)),
        videoCount: videos?.length || 0,
      },
      accounts: accounts || [],
      topVideos,
      viralityBuckets,
      durationAnalysis,
      videos: videos || [],
    });
  } catch (err: any) {
    console.error("Intelligence API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
