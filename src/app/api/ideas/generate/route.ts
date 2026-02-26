import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateIdeas } from "@/lib/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niche, platform, count } = body;

    // Get top performing content for context
    const { data: topVideos } = await supabase
      .from("videos")
      .select("title, view_count, nx_avg, platform")
      .order("nx_avg", { ascending: false })
      .limit(10);

    const topContent = topVideos?.map(
      (v) => `[${v.platform}] "${v.title}" — ${v.nx_avg}x avg, ${v.view_count} views`
    );

    // Get recent trends
    const { data: trends } = await supabase
      .from("trends")
      .select("title, type, growth_rate")
      .order("growth_rate", { ascending: false })
      .limit(10);

    const trendList = trends?.map(
      (t) => `[${t.type}] ${t.title} (${t.growth_rate}% growth)`
    );

    const result = await generateIdeas({
      niche,
      platform,
      count: count || 5,
      trends: trendList,
      topContent,
    });

    // Parse and save ideas
    let ideas;
    try {
      const parsed = JSON.parse(result);
      ideas = Array.isArray(parsed) ? parsed : parsed.ideas || [parsed];
    } catch {
      ideas = [{ topic: "Generated idea", hook: result, angle: "", format: "", target_platform: platform || "tiktok", reasoning: "" }];
    }

    // Save to database
    for (const idea of ideas) {
      await supabase.from("content_ideas").insert({
        topic: idea.topic || "Untitled idea",
        hook: idea.hook,
        format: idea.format,
        target_platform: idea.target_platform || platform || "tiktok",
        ai_reasoning: idea.reasoning || idea.angle,
        metadata: { angle: idea.angle, niche },
      });
    }

    return NextResponse.json({ success: true, ideas, count: ideas.length });
  } catch (err: any) {
    console.error("Idea generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
