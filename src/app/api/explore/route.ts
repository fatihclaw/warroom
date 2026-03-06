import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getApiKey } from "@/lib/keys";
import { getTikTokProfile } from "@/lib/fetchers/tiktok";
import { getInstagramProfile } from "@/lib/fetchers/instagram";
import { getTwitterProfile } from "@/lib/fetchers/twitter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/explore — search for accounts across platforms
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

    // TikTok, Instagram, Twitter — use Apify fetchers to look up the profile by query as username
    if (platform === "tiktok") {
      if (!process.env.APIFY_API_TOKEN) {
        return NextResponse.json(
          { error: "APIFY_API_TOKEN not configured. Add it in Settings." },
          { status: 400 }
        );
      }

      const profile = await getTikTokProfile(query);
      if (!profile || (!profile.followerCount && !profile.displayName)) {
        return NextResponse.json({ results: [] });
      }

      const { data: tracked } = await supabase
        .from("tracked_accounts")
        .select("username")
        .eq("platform", "tiktok");
      const trackedUsernames = new Set((tracked || []).map((t) => t.username));

      return NextResponse.json({
        results: [{
          id: profile.username,
          platform: "tiktok",
          username: profile.username,
          display_name: profile.displayName,
          description: profile.bio?.slice(0, 200) || "",
          avatar_url: profile.avatar,
          subscriber_count: profile.followerCount,
          video_count: profile.videoCount,
          view_count: profile.likeCount,
          already_tracked: trackedUsernames.has(profile.username),
          profile_url: `https://www.tiktok.com/@${profile.username}`,
        }],
      });
    }

    if (platform === "instagram") {
      if (!process.env.APIFY_API_TOKEN) {
        return NextResponse.json(
          { error: "APIFY_API_TOKEN not configured. Add it in Settings." },
          { status: 400 }
        );
      }

      const profile = await getInstagramProfile(query);
      if (!profile) {
        return NextResponse.json({ results: [] });
      }

      const { data: tracked } = await supabase
        .from("tracked_accounts")
        .select("username")
        .eq("platform", "instagram");
      const trackedUsernames = new Set((tracked || []).map((t) => t.username));

      return NextResponse.json({
        results: [{
          id: profile.username,
          platform: "instagram",
          username: profile.username,
          display_name: profile.displayName,
          description: profile.bio?.slice(0, 200) || "",
          avatar_url: profile.avatar,
          subscriber_count: profile.followerCount,
          video_count: profile.postCount,
          view_count: 0,
          already_tracked: trackedUsernames.has(profile.username),
          profile_url: `https://www.instagram.com/${profile.username}/`,
        }],
      });
    }

    if (platform === "twitter") {
      if (!process.env.APIFY_API_TOKEN) {
        return NextResponse.json(
          { error: "APIFY_API_TOKEN not configured. Add it in Settings." },
          { status: 400 }
        );
      }

      const profile = await getTwitterProfile(query);
      if (!profile) {
        return NextResponse.json({ results: [] });
      }

      const { data: tracked } = await supabase
        .from("tracked_accounts")
        .select("username")
        .eq("platform", "twitter");
      const trackedUsernames = new Set((tracked || []).map((t) => t.username));

      return NextResponse.json({
        results: [{
          id: profile.username,
          platform: "twitter",
          username: profile.username,
          display_name: profile.displayName,
          description: profile.bio?.slice(0, 200) || "",
          avatar_url: profile.avatar,
          subscriber_count: profile.followerCount,
          video_count: profile.tweetCount,
          view_count: 0,
          already_tracked: trackedUsernames.has(profile.username),
          profile_url: `https://x.com/${profile.username}`,
        }],
      });
    }

    return NextResponse.json({
      results: [],
      message: `Search for ${platform} accounts is not yet supported.`,
    });
  } catch (err: any) {
    console.error("Explore API error:", err);
    return NextResponse.json(
      { error: err.message || "Search failed" },
      { status: 500 }
    );
  }
}
