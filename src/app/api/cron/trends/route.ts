import { NextRequest, NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/cron/trends — triggered by Vercel cron, discovers trends and alerts
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const origin = req.nextUrl.origin;

    // Fetch trending and save to DB
    const res = await fetch(
      `${origin}/api/discover?source=trending&save=true`
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({
        cron: "trends",
        timestamp: new Date().toISOString(),
        error: data.error,
      });
    }

    // Check for surging hashtags (appear in 3+ trending videos)
    const surgingHashtags = (data.hashtags || []).filter(
      (h: any) => h.count >= 3
    );

    // Send Telegram alerts for surging hashtags
    if (surgingHashtags.length > 0) {
      const lines = surgingHashtags
        .slice(0, 5)
        .map(
          (h: any) =>
            `<b>${h.tag}</b> — ${h.count} videos, ${formatCompact(h.totalViews)} views`
        );
      await sendTelegramAlert(
        `🔥 <b>Surging Hashtags</b>\n\n${lines.join("\n")}\n\n📊 Check Trend Radar for details`
      );
    }

    // Check for viral videos (>100k views/hour)
    const viralVideos = (data.videos || []).filter(
      (v: any) => v.viewsPerHour > 100000
    );
    if (viralVideos.length > 0) {
      const topViral = viralVideos[0];
      await sendTelegramAlert(
        `🚀 <b>Viral Alert</b>\n\n${topViral.title}\n${formatCompact(topViral.viewCount)} views (${formatCompact(topViral.viewsPerHour)}/hr)\nby ${topViral.channelTitle}\n\nhttps://youtube.com/watch?v=${topViral.id}`
      );
    }

    return NextResponse.json({
      cron: "trends",
      timestamp: new Date().toISOString(),
      videosDiscovered: data.videos?.length || 0,
      hashtagsFound: data.hashtags?.length || 0,
      surgingHashtags: surgingHashtags.length,
      alertsSent: surgingHashtags.length > 0 || viralVideos.length > 0,
    });
  } catch (err: any) {
    console.error("Cron trends error:", err);
    return NextResponse.json(
      { error: err.message || "Cron trends failed" },
      { status: 500 }
    );
  }
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
