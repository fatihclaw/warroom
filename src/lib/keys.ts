import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

// Map of settings key names to env var names
const ENV_MAP: Record<string, string> = {
  fireworks_api_key: "FIREWORKS_API_KEY",
  youtube_api_key: "YOUTUBE_API_KEY",
  twitter_bearer_token: "TWITTER_BEARER_TOKEN",
  telegram_bot_token: "TELEGRAM_BOT_TOKEN",
  telegram_chat_id: "TELEGRAM_CHAT_ID",
  cron_secret: "CRON_SECRET",
};

/**
 * Unified key resolver: checks process.env first, then Supabase users.settings JSONB.
 * Fixes the root bug where API routes read env vars but the Settings page saves to DB.
 */
export async function getApiKey(keyName: string): Promise<string | null> {
  // 1. Check env var
  const envName = ENV_MAP[keyName] || keyName.toUpperCase();
  const envVal = process.env[envName];
  if (envVal && envVal !== "placeholder_add_later") {
    return envVal;
  }

  // 2. Fall back to DB settings
  try {
    const { data } = await supabase
      .from("users")
      .select("settings")
      .eq("id", DEFAULT_USER_ID)
      .single();
    const dbVal = data?.settings?.[keyName];
    if (dbVal && typeof dbVal === "string" && dbVal.length > 0) {
      return dbVal;
    }
  } catch {
    // DB not reachable — return null
  }

  return null;
}

/**
 * Check multiple keys at once — useful for health checks.
 */
export async function checkKeys(
  keyNames: string[]
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  for (const key of keyNames) {
    result[key] = (await getApiKey(key)) !== null;
  }
  return result;
}
