import { NextRequest, NextResponse } from "next/server";

// GET /api/cron/sync — triggered by Vercel cron, syncs all accounts
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const origin = req.nextUrl.origin;
    const res = await fetch(`${origin}/api/sync/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json({
      cron: "sync",
      timestamp: new Date().toISOString(),
      ...data,
    });
  } catch (err: any) {
    console.error("Cron sync error:", err);
    return NextResponse.json(
      { error: err.message || "Cron sync failed" },
      { status: 500 }
    );
  }
}
