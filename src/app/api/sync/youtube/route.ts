import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getChannelByHandle,
  getChannelVideos,
  getVideoById,
} from "@/lib/fetchers/youtube";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/sync/youtube — sync a YouTube account or video
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YouTube API key not configured. Add YOUTUBE_API_KEY to Settings." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { type, id, accountId } = body;

    if (type === "profile") {
      // Sync a YouTube channel
      const channel = await getChannelByHandle(id, apiKey);
      if (!channel) {
        return NextResponse.json(
          { error: "YouTube channel not found" },
          { status: 404 }
        );
      }

      // Update account info
      const { data: account, error: accErr } = await supabase
        .from("tracked_accounts")
        .update({
          platform_id: channel.id,
          display_name: channel.title,
          avatar_url: channel.avatar,
          follower_count: channel.subscriberCount,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", accountId)
        .select()
        .single();

      if (accErr) throw accErr;

      // Fetch latest videos
      const videos = await getChannelVideos(channel.id, apiKey, 50);
      const avgViews =
        videos.reduce((s, v) => s + v.viewCount, 0) / (videos.length || 1);

      // Upsert videos
      for (const v of videos) {
        const engagementRate =
          v.viewCount > 0
            ? ((v.likeCount + v.commentCount) / v.viewCount) * 100
            : 0;

        await supabase.from("videos").upsert(
          {
            account_id: accountId,
            platform: "youtube",
            platform_video_id: v.id,
            title: v.title,
            description: v.description,
            thumbnail_url: v.thumbnail,
            video_url: `https://youtube.com/watch?v=${v.id}`,
            duration_seconds: v.duration,
            view_count: v.viewCount,
            like_count: v.likeCount,
            comment_count: v.commentCount,
            engagement_rate: Number(engagementRate.toFixed(4)),
            nx_avg: Number((v.viewCount / avgViews).toFixed(2)),
            published_at: v.publishedAt,
          },
          { onConflict: "platform,platform_video_id" }
        );
      }

      // Save account snapshot
      await supabase.from("account_snapshots").insert({
        account_id: accountId,
        follower_count: channel.subscriberCount,
        total_views: channel.viewCount,
        total_videos: channel.videoCount,
        avg_views: Math.round(avgViews),
        avg_engagement_rate: videos.length > 0
          ? Number(
              (
                videos.reduce((s, v) =>
                  s + ((v.likeCount + v.commentCount) / (v.viewCount || 1)) * 100, 0
                ) / videos.length
              ).toFixed(4)
            )
          : 0,
      });

      return NextResponse.json({
        success: true,
        channel: channel.title,
        videosSynced: videos.length,
      });
    } else {
      // Sync a single video
      const video = await getVideoById(id, apiKey);
      if (!video) {
        return NextResponse.json(
          { error: "YouTube video not found" },
          { status: 404 }
        );
      }

      const engagementRate =
        video.viewCount > 0
          ? ((video.likeCount + video.commentCount) / video.viewCount) * 100
          : 0;

      const { error } = await supabase.from("videos").upsert(
        {
          platform: "youtube",
          platform_video_id: video.id,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnail,
          video_url: `https://youtube.com/watch?v=${video.id}`,
          duration_seconds: video.duration,
          view_count: video.viewCount,
          like_count: video.likeCount,
          comment_count: video.commentCount,
          engagement_rate: Number(engagementRate.toFixed(4)),
          published_at: video.publishedAt,
        },
        { onConflict: "platform,platform_video_id" }
      );

      if (error) throw error;

      return NextResponse.json({
        success: true,
        video: video.title,
        views: video.viewCount,
      });
    }
  } catch (err: any) {
    console.error("YouTube sync error:", err);
    return NextResponse.json(
      { error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
