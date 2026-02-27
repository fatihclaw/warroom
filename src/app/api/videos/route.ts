import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/videos — fetch all tracked videos with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const accountId = searchParams.get("account_id");
    const sort = searchParams.get("sort") || "view_count";
    const order = searchParams.get("order") || "desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    let query = supabase
      .from("videos")
      .select("*, tracked_accounts(username, platform, display_name)", {
        count: "exact",
      })
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (platform && platform !== "all") {
      query = query.eq("platform", platform);
    }
    if (accountId && accountId !== "all") {
      query = query.eq("account_id", accountId);
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      videos: data || [],
      total: count || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
