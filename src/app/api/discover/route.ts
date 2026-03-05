import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getTrendingVideos,
  searchViralVideos,
  getVideoCategories,
} from "@/lib/fetchers/youtube";
import { searchPopularTweets, getTrendingTopics } from "@/lib/fetchers/twitter";
import { searchTikTokVideos } from "@/lib/fetchers/tiktok";
import { getApiKey } from "@/lib/keys";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) || []).map((t) => t.toLowerCase());
}

// Normalize all platform results into a common shape
interface DiscoverResult {
  id: string;
  platform: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  url: string;
  source: string;
  extra?: Record<string, any>;
}

// GET /api/discover — multi-platform viral content discovery
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source") || "trending";
    const platformFilter = searchParams.get("platform") || "all";
    const category = searchParams.get("category") || "";
    const query = searchParams.get("query") || "";
    const region = searchParams.get("region") || "US";
    const period = searchParams.get("period") || "24h";
    const save = searchParams.get("save") === "true";

    // If requesting YouTube categories list
    if (searchParams.get("categories") === "true") {
      const ytKey = await getApiKey("youtube_api_key");
      if (!ytKey) return NextResponse.json({ categories: [] });
      const categories = await getVideoCategories(ytKey, region);
      return NextResponse.json({ categories });
    }

    let results: DiscoverResult[] = [];
    const errors: Record<string, string> = {};

    // ---- YOUTUBE ----
    if (platformFilter === "all" || platformFilter === "youtube") {
      const ytKey = await getApiKey("youtube_api_key");
      if (ytKey) {
        try {
          if (source === "trending" || source === "all") {
            const trending = await getTrendingVideos(
              ytKey, region, category || undefined, 25
            );
            results.push(
              ...trending.map((v) => ({
                id: v.id,
                platform: "youtube",
                title: v.title,
                description: v.description,
                thumbnail: v.thumbnail,
                channelTitle: v.channelTitle,
                viewCount: v.viewCount,
                likeCount: v.likeCount,
                commentCount: v.commentCount,
                publishedAt: v.publishedAt,
                url: `https://youtube.com/watch?v=${v.id}`,
                source: "trending",
              }))
            );
          }
          if ((source === "search" || source === "all") && query) {
            const daysAgo = { "24h": 1, "7d": 7, "30d": 30 }[period] || 7;
            const after = new Date(Date.now() - daysAgo * 86400000).toISOString();
            const searched = await searchViralVideos(ytKey, query, after, 25);
            results.push(
              ...searched.map((v) => ({
                id: v.id,
                platform: "youtube",
                title: v.title,
                description: v.description,
                thumbnail: v.thumbnail,
                channelTitle: v.channelTitle,
                viewCount: v.viewCount,
                likeCount: v.likeCount,
                commentCount: v.commentCount,
                publishedAt: v.publishedAt,
                url: `https://youtube.com/watch?v=${v.id}`,
                source: "search",
              }))
            );
          }
        } catch (e: any) {
          errors.youtube = e.message;
        }
      } else if (platformFilter === "youtube") {
        errors.youtube = "YouTube API key not configured";
      }
    }

    // ---- X / TWITTER ----
    if (platformFilter === "all" || platformFilter === "twitter") {
      const twitterToken = await getApiKey("twitter_bearer_token");
      if (twitterToken) {
        try {
          // Search popular tweets
          const searchQuery = query || "viral OR trending";
          const tweets = await searchPopularTweets(twitterToken, searchQuery, 25);
          results.push(
            ...tweets.map((t) => ({
              id: t.id,
              platform: "twitter",
              title: t.text.substring(0, 120),
              description: t.text,
              thumbnail: "",
              channelTitle: `@${t.authorUsername}`,
              viewCount: t.viewCount,
              likeCount: t.likeCount,
              commentCount: t.replyCount,
              publishedAt: t.createdAt,
              url: `https://x.com/${t.authorUsername}/status/${t.id}`,
              source: query ? "search" : "trending",
              extra: {
                retweetCount: t.retweetCount,
                quoteCount: t.quoteCount,
              },
            }))
          );

          // Also get trending topics if no specific query
          if (!query && (source === "trending" || source === "all")) {
            const trends = await getTrendingTopics(twitterToken);
            // Store as hashtag trends
            for (const t of trends.slice(0, 10)) {
              if (save) {
                await supabase.from("trends").upsert(
                  {
                    platform: "twitter",
                    type: "hashtag",
                    name: t.name.toLowerCase(),
                    data: { tweetVolume: t.tweetVolume, url: t.url },
                    score: t.tweetVolume || 0,
                  },
                  { onConflict: "platform,type,name" }
                );
              }
            }
          }
        } catch (e: any) {
          errors.twitter = e.message;
        }
      } else if (platformFilter === "twitter") {
        errors.twitter = "X/Twitter Bearer Token not configured — add it in Settings";
      }
    }

    // ---- TIKTOK ----
    if (platformFilter === "all" || platformFilter === "tiktok") {
      try {
        const searchQuery = query || "trending";
        const tiktokVideos = await searchTikTokVideos(searchQuery, 20);
        results.push(
          ...tiktokVideos.map((v) => ({
            id: v.id,
            platform: "tiktok",
            title: v.title,
            description: v.description,
            thumbnail: v.thumbnail,
            channelTitle: `@${v.authorUsername}`,
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            publishedAt: v.createdAt,
            url: v.url,
            source: "search",
            extra: { shareCount: v.shareCount },
          }))
        );
      } catch (e: any) {
        errors.tiktok = e.message;
      }
    }

    // ---- INSTAGRAM ----
    if (platformFilter === "instagram") {
      errors.instagram =
        "Instagram discovery requires browser automation (OpenClaw). Track individual Reels via the + button.";
    }

    // Deduplicate
    const seen = new Set<string>();
    results = results.filter((v) => {
      const key = `${v.platform}:${v.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Enrich with virality score
    const now = Date.now();
    const enriched = results.map((v) => {
      const ageHours =
        v.publishedAt
          ? (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60)
          : 0;
      const viewsPerHour =
        ageHours > 0 ? Math.round(v.viewCount / ageHours) : 0;
      const hashtags = extractHashtags(`${v.title} ${v.description}`);
      const engagementRate =
        v.viewCount > 0
          ? ((v.likeCount + v.commentCount) / v.viewCount) * 100
          : 0;

      return {
        ...v,
        viewsPerHour,
        hashtags,
        engagementRate: Number(engagementRate.toFixed(2)),
        ageHours: Math.round(ageHours),
      };
    });

    // Sort by views per hour
    enriched.sort((a, b) => b.viewsPerHour - a.viewsPerHour);

    // Aggregate hashtags
    const hashtagCounts: Record<string, { count: number; totalViews: number }> = {};
    for (const v of enriched) {
      for (const tag of v.hashtags) {
        if (!hashtagCounts[tag]) hashtagCounts[tag] = { count: 0, totalViews: 0 };
        hashtagCounts[tag].count++;
        hashtagCounts[tag].totalViews += v.viewCount;
      }
    }
    const topHashtags = Object.entries(hashtagCounts)
      .map(([tag, stats]) => ({ tag, ...stats }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 20);

    // Save to trends table if requested
    if (save && enriched.length > 0) {
      for (const v of enriched.slice(0, 10)) {
        await supabase.from("trends").upsert(
          {
            platform: v.platform,
            type: "video",
            name: v.title.substring(0, 200),
            data: {
              id: v.id,
              channelTitle: v.channelTitle,
              viewCount: v.viewCount,
              viewsPerHour: v.viewsPerHour,
              hashtags: v.hashtags,
              thumbnail: v.thumbnail,
              url: v.url,
              source: v.source,
            },
            score: v.viewsPerHour,
          },
          { onConflict: "platform,type,name" }
        );
      }
      for (const ht of topHashtags.slice(0, 10)) {
        await supabase.from("trends").upsert(
          {
            platform: "multi",
            type: "hashtag",
            name: ht.tag,
            data: { count: ht.count, totalViews: ht.totalViews },
            score: ht.totalViews,
          },
          { onConflict: "platform,type,name" }
        );
      }
    }

    return NextResponse.json({
      videos: enriched,
      hashtags: topHashtags,
      total: enriched.length,
      source,
      platform: platformFilter,
      region,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Discover API error:", err);
    return NextResponse.json(
      { error: err.message || "Discovery failed" },
      { status: 500 }
    );
  }
}
