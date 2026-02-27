import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Default user ID for single-user mode
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

async function ensureUser() {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", DEFAULT_USER_ID)
    .single();

  if (!data) {
    await supabase.from("users").insert({
      id: DEFAULT_USER_ID,
      email: "admin@warroom.local",
      full_name: "Admin",
      settings: {},
    });
  }
}

// GET /api/settings — fetch user settings
export async function GET() {
  try {
    await ensureUser();

    const { data, error } = await supabase
      .from("users")
      .select("settings")
      .eq("id", DEFAULT_USER_ID)
      .single();

    if (error) throw error;

    // Mask sensitive keys
    const settings = data?.settings || {};
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string" && value.length > 8) {
        masked[key] = value.substring(0, 4) + "..." + value.slice(-4);
      } else {
        masked[key] = value as string;
      }
    }

    return NextResponse.json({ settings: masked });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings — update user settings
export async function POST(req: NextRequest) {
  try {
    await ensureUser();

    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: "key is required" },
        { status: 400 }
      );
    }

    // Get current settings
    const { data: current } = await supabase
      .from("users")
      .select("settings")
      .eq("id", DEFAULT_USER_ID)
      .single();

    const settings = { ...(current?.settings || {}), [key]: value };

    const { error } = await supabase
      .from("users")
      .update({ settings })
      .eq("id", DEFAULT_USER_ID);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
