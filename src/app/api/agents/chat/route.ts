import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { chatCompletion } from "@/lib/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Get context from the database
    const { data: accounts } = await supabase
      .from("tracked_accounts")
      .select("username, platform, follower_count, display_name")
      .limit(20);

    const { data: topVideos } = await supabase
      .from("videos")
      .select("title, platform, view_count, nx_avg, engagement_rate")
      .order("view_count", { ascending: false })
      .limit(10);

    const { data: recentIdeas } = await supabase
      .from("content_ideas")
      .select("topic, hook, target_platform")
      .order("created_at", { ascending: false })
      .limit(5);

    const contextSummary = `
You have access to this data:
- Tracked accounts: ${accounts?.map((a) => `@${a.username} (${a.platform}, ${a.follower_count} followers)`).join(", ") || "none yet"}
- Top videos: ${topVideos?.map((v) => `"${v.title}" [${v.platform}] ${v.view_count} views, ${v.nx_avg}x avg`).join("; ") || "none yet"}
- Recent ideas: ${recentIdeas?.map((i) => `"${i.topic}" for ${i.target_platform}`).join("; ") || "none yet"}
`;

    // Get conversation history
    let messages: { role: string; content: string }[] = [];
    if (conversationId) {
      const { data: conv } = await supabase
        .from("agent_conversations")
        .select("messages")
        .eq("id", conversationId)
        .single();
      if (conv?.messages) {
        messages = conv.messages as { role: string; content: string }[];
      }
    }

    // Add the new message
    messages.push({ role: "user", content: message });

    const result = await chatCompletion([
      {
        role: "system",
        content: `You are Morpheus, the WAR ROOM content intelligence AI. You help with content strategy, trend analysis, idea generation, script writing, and content review.

${contextSummary}

Be concise, data-driven, and actionable. When the user asks about trends or content strategy, reference the actual data. If they ask you to generate ideas or scripts, do it directly.`,
      },
      ...(messages as { role: "system" | "user" | "assistant"; content: string }[]),
    ]);

    // Add assistant response
    messages.push({ role: "assistant", content: result.content });

    // Save conversation
    let convId = conversationId;
    if (convId) {
      await supabase
        .from("agent_conversations")
        .update({ messages, updated_at: new Date().toISOString() })
        .eq("id", convId);
    } else {
      const { data } = await supabase
        .from("agent_conversations")
        .insert({
          title: message.substring(0, 100),
          messages,
        })
        .select("id")
        .single();
      convId = data?.id;
    }

    return NextResponse.json({
      response: result.content,
      conversationId: convId,
    });
  } catch (err: any) {
    console.error("Agent chat error:", err);
    return NextResponse.json(
      { error: err.message || "Chat failed" },
      { status: 500 }
    );
  }
}
