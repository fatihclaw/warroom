import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/trends — fetch trending content from tracked videos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "7d";
    const platform = searchParams.get("platform");
    const type = searchParams.get("type") || "content"; // content, hashtags, formats

    // Get all tracked videos with their metrics
    let query = supabase
      .from("videos")
      .select("*, tracked_accounts(username, display_name, platform)")
      .order("view_count", { ascending: false });

    if (platform && platform !== "all") {
      query = query.eq("platform", platform);
    }

    // Time filter
    const now = new Date();
    let since: Date;
    switch (period) {
      case "24h":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    query = query.gte("published_at", since.toISOString());

    const { data: videos, error } = await query.limit(50);
    if (error) throw error;

    // Calculate average views per account for "Nx avg" metric
    const accountAvgs: Record<string, number> = {};
    const accountVideoCounts: Record<string, number> = {};

    if (videos) {
      for (const v of videos) {
        const accId = v.account_id || "unknown";
        if (!accountAvgs[accId]) {
          accountAvgs[accId] = 0;
          accountVideoCounts[accId] = 0;
        }
        accountAvgs[accId] += v.view_count || 0;
        accountVideoCounts[accId]++;
      }
      for (const id of Object.keys(accountAvgs)) {
        accountAvgs[id] = accountAvgs[id] / (accountVideoCounts[id] || 1);
      }
    }

    // Build trending content — videos that outperform their account average
    const trending = (videos || [])
      .map((v) => {
        const accId = v.account_id || "unknown";
        const avg = accountAvgs[accId] || 1;
        const nxAvg = avg > 0 ? (v.view_count || 0) / avg : 0;
        return {
          ...v,
          nx_avg: parseFloat(nxAvg.toFixed(1)),
          account_avg: Math.round(avg),
        };
      })
      .sort((a, b) => b.nx_avg - a.nx_avg);

    // Extract trending hashtags from video descriptions/tags
    const hashtagMap: Record<string, { count: number; totalViews: number }> = {};
    for (const v of videos || []) {
      const text = `${v.title || ""} ${v.description || ""}`;
      const tags = text.match(/#\w+/g) || [];
      for (const tag of tags) {
        const lower = tag.toLowerCase();
        if (!hashtagMap[lower]) hashtagMap[lower] = { count: 0, totalViews: 0 };
        hashtagMap[lower].count++;
        hashtagMap[lower].totalViews += v.view_count || 0;
      }
    }

    const hashtags = Object.entries(hashtagMap)
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        totalViews: stats.totalViews,
        avgViews: Math.round(stats.totalViews / stats.count),
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 30);

    // Categorize formats based on duration
    const formats: Record<string, { count: number; avgViews: number; totalViews: number }> = {
      "Short (< 60s)": { count: 0, avgViews: 0, totalViews: 0 },
      "Medium (1-5m)": { count: 0, avgViews: 0, totalViews: 0 },
      "Long (5-15m)": { count: 0, avgViews: 0, totalViews: 0 },
      "Extended (15m+)": { count: 0, avgViews: 0, totalViews: 0 },
    };

    for (const v of videos || []) {
      const dur = v.duration_seconds || 0;
      const views = v.view_count || 0;
      let cat: string;
      if (dur < 60) cat = "Short (< 60s)";
      else if (dur < 300) cat = "Medium (1-5m)";
      else if (dur < 900) cat = "Long (5-15m)";
      else cat = "Extended (15m+)";

      formats[cat].count++;
      formats[cat].totalViews += views;
    }

    for (const key of Object.keys(formats)) {
      formats[key].avgViews = formats[key].count > 0
        ? Math.round(formats[key].totalViews / formats[key].count)
        : 0;
    }

    return NextResponse.json({
      trending: trending.slice(0, 20),
      hashtags,
      formats: Object.entries(formats).map(([name, stats]) => ({
        name,
        ...stats,
      })),
      totalVideos: videos?.length || 0,
    });
  } catch (err: any) {
    console.error("Trends API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch trends" },
      { status: 500 }
    );
  }
}
