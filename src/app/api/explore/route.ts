import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Helper to get API key from user settings
async function getApiKey(key: string): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("settings")
    .eq("id", "00000000-0000-0000-0000-000000000001")
    .single();
  return data?.settings?.[key] || null;
}

// GET /api/explore — search for YouTube channels
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const platform = searchParams.get("platform") || "youtube";

    if (!query?.trim()) {
      return NextResponse.json({ results: [] });
    }

    if (platform === "youtube") {
      const apiKey = await getApiKey("youtube_api_key");
      if (!apiKey) {
        return NextResponse.json(
          { error: "YouTube API key not configured. Add it in Settings." },
          { status: 400 }
        );
      }

      // Search YouTube channels
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) {
        const err = await searchRes.text();
        throw new Error(`YouTube API error: ${err}`);
      }
      const searchData = await searchRes.json();

      // Get channel details (subscriber counts)
      const channelIds = searchData.items
        ?.map((item: any) => item.snippet?.channelId || item.id?.channelId)
        .filter(Boolean)
        .join(",");

      let channels: any[] = [];
      if (channelIds) {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          channels = detailsData.items || [];
        }
      }

      // Check which are already tracked
      const { data: tracked } = await supabase
        .from("tracked_accounts")
        .select("platform_id")
        .eq("platform", "youtube");

      const trackedIds = new Set((tracked || []).map((t) => t.platform_id));

      const results = channels.map((ch: any) => ({
        id: ch.id,
        platform: "youtube",
        username: ch.snippet?.customUrl?.replace("@", "") || ch.snippet?.title,
        display_name: ch.snippet?.title,
        description: ch.snippet?.description?.slice(0, 200),
        avatar_url: ch.snippet?.thumbnails?.default?.url,
        subscriber_count: parseInt(ch.statistics?.subscriberCount || "0"),
        video_count: parseInt(ch.statistics?.videoCount || "0"),
        view_count: parseInt(ch.statistics?.viewCount || "0"),
        already_tracked: trackedIds.has(ch.id),
        profile_url: `https://youtube.com/channel/${ch.id}`,
      }));

      return NextResponse.json({ results });
    }

    // For other platforms, return empty for now
    return NextResponse.json({
      results: [],
      message: `Search for ${platform} accounts is not yet supported. Try YouTube.`,
    });
  } catch (err: any) {
    console.error("Explore API error:", err);
    return NextResponse.json(
      { error: err.message || "Search failed" },
      { status: 500 }
    );
  }
}
