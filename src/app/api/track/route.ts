import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, platform, type, id, username } = body;

    if (!platform || !id) {
      return NextResponse.json(
        { error: "Invalid URL — could not detect platform or ID" },
        { status: 400 }
      );
    }

    if (type === "profile") {
      // Track an account — use insert instead of upsert (user_id is null in single-user mode)
      // First check if already exists
      const { data: existing } = await supabase
        .from("tracked_accounts")
        .select("id")
        .eq("platform", platform)
        .eq("username", username || id)
        .single();

      if (existing) {
        return NextResponse.json({
          success: true,
          type: "account",
          data: existing,
          message: "Account already tracked",
        });
      }

      const { data, error } = await supabase
        .from("tracked_accounts")
        .insert({
          platform,
          username: username || id,
          display_name: username || id,
          profile_url: url,
          platform_id: id,
        })
        .select()
        .single();

      if (error) {
        console.error("Track account error:", error);
        return NextResponse.json(
          { error: "Failed to track account: " + error.message },
          { status: 500 }
        );
      }

      // Auto-sync accounts immediately
      const syncPlatforms = ["youtube", "tiktok", "instagram", "twitter"];
      if (syncPlatforms.includes(platform) && data) {
        try {
          const origin = process.env.NEXT_PUBLIC_SUPABASE_URL ? req.nextUrl.origin : "http://localhost:3000";
          const syncRes = await fetch(
            `${origin}/api/sync/${platform === "twitter" ? "twitter" : platform}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "profile",
                id: username || id,
                accountId: data.id,
              }),
            }
          );
          const syncData = await syncRes.json();
          return NextResponse.json({
            success: true,
            type: "account",
            data,
            sync: syncData,
          });
        } catch {
          // Sync failed but account was created
        }
      }

      return NextResponse.json({ success: true, type: "account", data });
    } else {
      // Track a video/post
      // Check if already exists
      const { data: existing } = await supabase
        .from("videos")
        .select("id")
        .eq("platform", platform)
        .eq("platform_video_id", id)
        .single();

      if (existing) {
        return NextResponse.json({
          success: true,
          type: "video",
          data: existing,
          message: "Video already tracked",
        });
      }

      const { data, error } = await supabase
        .from("videos")
        .insert({
          platform,
          platform_video_id: id,
          video_url: url,
        })
        .select()
        .single();

      if (error) {
        console.error("Track video error:", error);
        return NextResponse.json(
          { error: "Failed to track video: " + error.message },
          { status: 500 }
        );
      }

      // Auto-sync videos immediately for all platforms
      const videoSyncPlatforms = ["youtube", "tiktok", "instagram", "twitter"];
      if (videoSyncPlatforms.includes(platform) && data) {
        try {
          const syncEndpoint = platform === "twitter" ? "twitter" : platform;
          await fetch(`${req.nextUrl.origin}/api/sync/${syncEndpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "video", id, url, username }),
          });
        } catch {
          // Sync failed but video was created
        }
      }

      return NextResponse.json({ success: true, type: "video", data });
    }
  } catch (err: any) {
    console.error("Track error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
