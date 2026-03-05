import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTikTokVideo, getTikTokProfile } from "@/lib/fetchers/tiktok";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/sync/tiktok — sync a TikTok account or video
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, accountId, url } = body;

    if (type === "profile") {
      const profile = await getTikTokProfile(id);
      if (!profile) {
        return NextResponse.json(
          { error: "Could not fetch TikTok profile" },
          { status: 404 }
        );
      }

      // Update account info
      const { error: accErr } = await supabase
        .from("tracked_accounts")
        .update({
          display_name: profile.displayName,
          avatar_url: profile.avatar,
          follower_count: profile.followerCount,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", accountId);

      if (accErr) throw accErr;

      // Save account snapshot
      await supabase.from("account_snapshots").insert({
        account_id: accountId,
        follower_count: profile.followerCount,
        total_views: profile.likeCount,
        total_videos: profile.videoCount,
        avg_views: 0,
        avg_engagement_rate: 0,
      });

      return NextResponse.json({
        success: true,
        profile: profile.displayName,
        followers: profile.followerCount,
      });
    } else {
      // Sync a single video
      const videoUrl = url || `https://www.tiktok.com/@${id}/video/${id}`;
      const video = await getTikTokVideo(videoUrl);

      if (!video) {
        return NextResponse.json(
          { error: "Could not fetch TikTok video" },
          { status: 404 }
        );
      }

      const engagementRate =
        video.viewCount > 0
          ? ((video.likeCount + video.commentCount) / video.viewCount) * 100
          : 0;

      const { error } = await supabase.from("videos").upsert(
        {
          platform: "tiktok",
          platform_video_id: video.id,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnail,
          video_url: video.url,
          duration_seconds: video.duration,
          view_count: video.viewCount,
          like_count: video.likeCount,
          comment_count: video.commentCount,
          share_count: video.shareCount,
          save_count: video.saveCount,
          engagement_rate: Number(engagementRate.toFixed(4)),
          hashtags: video.hashtags,
          published_at: video.createdAt || null,
          account_id: accountId || null,
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
    console.error("TikTok sync error:", err);
    return NextResponse.json(
      { error: err.message || "TikTok sync failed" },
      { status: 500 }
    );
  }
}
