import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTweet, getTwitterProfile } from "@/lib/fetchers/twitter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/sync/twitter — sync an X/Twitter account or tweet
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, accountId, username } = body;

    if (type === "profile") {
      const profile = await getTwitterProfile(id);
      if (!profile) {
        return NextResponse.json(
          { error: "Could not fetch X/Twitter profile" },
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
        total_videos: profile.tweetCount,
        avg_views: 0,
        avg_engagement_rate: 0,
      });

      return NextResponse.json({
        success: true,
        profile: profile.displayName,
        followers: profile.followerCount,
      });
    } else {
      // Sync a single tweet
      const tweet = await getTweet(id, username);

      if (!tweet) {
        return NextResponse.json(
          { error: "Could not fetch tweet" },
          { status: 404 }
        );
      }

      const totalEngagement =
        tweet.likeCount + tweet.retweetCount + tweet.replyCount + tweet.quoteCount;
      const engagementRate =
        tweet.viewCount > 0
          ? (totalEngagement / tweet.viewCount) * 100
          : 0;

      const { error } = await supabase.from("videos").upsert(
        {
          platform: "twitter",
          platform_video_id: tweet.id,
          title: tweet.text.substring(0, 200),
          description: tweet.text,
          thumbnail_url: tweet.mediaUrl || tweet.authorAvatar || "",
          video_url: tweet.url,
          duration_seconds: 0,
          view_count: tweet.viewCount,
          like_count: tweet.likeCount,
          comment_count: tweet.replyCount,
          share_count: tweet.retweetCount + tweet.quoteCount,
          save_count: tweet.bookmarkCount,
          engagement_rate: Number(engagementRate.toFixed(4)),
          hashtags: tweet.hashtags,
          published_at: tweet.createdAt || null,
          account_id: accountId || null,
        },
        { onConflict: "platform,platform_video_id" }
      );

      if (error) throw error;

      return NextResponse.json({
        success: true,
        tweet: tweet.text.substring(0, 60),
        views: tweet.viewCount,
      });
    }
  } catch (err: any) {
    console.error("Twitter sync error:", err);
    return NextResponse.json(
      { error: err.message || "Twitter sync failed" },
      { status: 500 }
    );
  }
}
