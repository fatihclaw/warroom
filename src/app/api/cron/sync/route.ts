import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/cron/sync — triggered by Vercel cron, syncs all accounts + captures snapshots
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const origin = req.nextUrl.origin;

    // 1. Sync all accounts (now supports all platforms)
    const syncRes = await fetch(`${origin}/api/sync/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const syncData = await syncRes.json();

    // 2. Capture daily metrics snapshots for all videos
    const snapshotsCreated = await captureMetricsSnapshots();

    return NextResponse.json({
      cron: "sync",
      timestamp: new Date().toISOString(),
      ...syncData,
      snapshotsCreated,
    });
  } catch (err: any) {
    console.error("Cron sync error:", err);
    return NextResponse.json(
      { error: err.message || "Cron sync failed" },
      { status: 500 }
    );
  }
}

// Capture point-in-time metrics snapshots for delta calculations
async function captureMetricsSnapshots(): Promise<number> {
  try {
    // Fetch all videos with current metrics
    const { data: videos, error } = await supabase
      .from("videos")
      .select("id, view_count, like_count, comment_count, share_count, save_count, engagement_rate")
      .not("view_count", "is", null);

    if (error || !videos?.length) return 0;

    // Batch insert snapshots
    const snapshots = videos.map((v) => ({
      video_id: v.id,
      view_count: v.view_count || 0,
      like_count: v.like_count || 0,
      comment_count: v.comment_count || 0,
      share_count: v.share_count || 0,
      save_count: v.save_count || 0,
      engagement_rate: v.engagement_rate || 0,
    }));

    // Insert in batches of 100
    let created = 0;
    for (let i = 0; i < snapshots.length; i += 100) {
      const batch = snapshots.slice(i, i + 100);
      const { error: insertErr } = await supabase
        .from("metrics_snapshots")
        .insert(batch);
      if (!insertErr) created += batch.length;
    }

    return created;
  } catch {
    return 0;
  }
}
