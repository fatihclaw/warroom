import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getInstagramPost, getInstagramProfile } from "@/lib/fetchers/instagram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/sync/instagram — sync an Instagram account or post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, accountId, url } = body;

    if (type === "profile") {
      const profile = await getInstagramProfile(id);
      if (!profile) {
        return NextResponse.json(
          { error: "Could not fetch Instagram profile" },
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
        total_views: 0,
        total_videos: profile.postCount,
        avg_views: 0,
        avg_engagement_rate: 0,
      });

      return NextResponse.json({
        success: true,
        profile: profile.displayName,
        followers: profile.followerCount,
      });
    } else {
      // Sync a single post/reel
      const postUrl =
        url || `https://www.instagram.com/p/${id}/`;
      const post = await getInstagramPost(postUrl);

      if (!post) {
        return NextResponse.json(
          { error: "Could not fetch Instagram post" },
          { status: 404 }
        );
      }

      const engagementRate =
        post.viewCount > 0
          ? ((post.likeCount + post.commentCount) / post.viewCount) * 100
          : post.likeCount > 0
            ? ((post.likeCount + post.commentCount) / post.likeCount) * 100
            : 0;

      const { error } = await supabase.from("videos").upsert(
        {
          platform: "instagram",
          platform_video_id: post.shortcode || post.id,
          title: post.title,
          description: post.description,
          thumbnail_url: post.thumbnail,
          video_url: post.url,
          duration_seconds: post.duration,
          view_count: post.viewCount,
          like_count: post.likeCount,
          comment_count: post.commentCount,
          share_count: post.shareCount,
          save_count: post.saveCount,
          engagement_rate: Number(engagementRate.toFixed(4)),
          hashtags: post.hashtags,
          published_at: post.createdAt || null,
          account_id: accountId || null,
        },
        { onConflict: "platform,platform_video_id" }
      );

      if (error) throw error;

      return NextResponse.json({
        success: true,
        video: post.title?.substring(0, 60),
        views: post.viewCount,
      });
    }
  } catch (err: any) {
    console.error("Instagram sync error:", err);
    return NextResponse.json(
      { error: err.message || "Instagram sync failed" },
      { status: 500 }
    );
  }
}
