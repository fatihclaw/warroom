import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateScript } from "@/lib/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, platform, tone, ideaId } = body;

    if (!idea || !platform) {
      return NextResponse.json(
        { error: "idea and platform are required" },
        { status: 400 }
      );
    }

    const script = await generateScript({ idea, platform, tone });

    // Save to database
    const { data, error } = await supabase
      .from("content_scripts")
      .insert({
        idea_id: ideaId || null,
        title: idea.substring(0, 100),
        platform,
        script_data: { raw: script, tone },
        plain_text: script,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, script, data });
  } catch (err: any) {
    console.error("Script generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate script" },
      { status: 500 }
    );
  }
}
