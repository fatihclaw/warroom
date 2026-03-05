import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/sync/all — sync all tracked accounts with sync_enabled=true
export async function POST(req: NextRequest) {
  try {
    const { data: accounts, error } = await supabase
      .from("tracked_accounts")
      .select("id, platform, username, platform_id, sync_enabled")
      .eq("sync_enabled", true);

    if (error) throw error;
    if (!accounts?.length) {
      return NextResponse.json({ message: "No accounts to sync", synced: 0 });
    }

    const origin = req.nextUrl.origin;
    const results: { account: string; success: boolean; error?: string }[] = [];

    for (const account of accounts) {
      try {
        if (account.platform === "youtube") {
          const res = await fetch(`${origin}/api/sync/youtube`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "profile",
              id: account.platform_id || account.username,
              accountId: account.id,
            }),
          });
          const data = await res.json();
          results.push({
            account: account.username,
            success: res.ok,
            error: data.error,
          });
        }
        // Add other platform sync handlers here
      } catch (err: any) {
        results.push({
          account: account.username,
          success: false,
          error: err.message,
        });
      }
    }

    const synced = results.filter((r) => r.success).length;
    return NextResponse.json({
      message: `Synced ${synced}/${accounts.length} accounts`,
      synced,
      total: accounts.length,
      results,
    });
  } catch (err: any) {
    console.error("Sync-all error:", err);
    return NextResponse.json(
      { error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
