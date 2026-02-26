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
      // Track an account
      const { data, error } = await supabase
        .from("tracked_accounts")
        .upsert(
          {
            platform,
            username: username || id,
            display_name: username || id,
            profile_url: url,
            platform_id: id,
          },
          { onConflict: "user_id,platform,username" }
        )
        .select()
        .single();

      if (error) {
        console.error("Track account error:", error);
        return NextResponse.json(
          { error: "Failed to track account: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, type: "account", data });
    } else {
      // Track a video/post
      const { data, error } = await supabase
        .from("videos")
        .upsert(
          {
            platform,
            platform_video_id: id,
            video_url: url,
          },
          { onConflict: "platform,platform_video_id" }
        )
        .select()
        .single();

      if (error) {
        console.error("Track video error:", error);
        return NextResponse.json(
          { error: "Failed to track video: " + error.message },
          { status: 500 }
        );
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
