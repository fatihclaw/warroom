import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/publishing — fetch scheduled posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM format
    const status = searchParams.get("status");

    let query = supabase
      .from("publishing_queue")
      .select("*, content_scripts(title, platform, plain_text)")
      .order("scheduled_at", { ascending: true });

    if (month) {
      const start = `${month}-01T00:00:00Z`;
      const endDate = new Date(start);
      endDate.setMonth(endDate.getMonth() + 1);
      query = query
        .gte("scheduled_at", start)
        .lt("scheduled_at", endDate.toISOString());
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ posts: data || [] });
  } catch (err: any) {
    console.error("Publishing API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/publishing — schedule a new post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scriptId, platform, scheduledAt, content } = body;

    if (!platform || !scheduledAt) {
      return NextResponse.json(
        { error: "platform and scheduledAt are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("publishing_queue")
      .insert({
        script_id: scriptId || null,
        platform,
        scheduled_at: scheduledAt,
        content: content || {},
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post: data });
  } catch (err: any) {
    console.error("Schedule post error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to schedule post" },
      { status: 500 }
    );
  }
}
