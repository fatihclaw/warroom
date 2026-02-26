import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/setup — run database migration via Supabase SQL
// This creates all required tables if they don't exist
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase credentials not configured" },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Test connection by trying a simple query
  const { error: testErr } = await supabase
    .from("users")
    .select("id")
    .limit(1);

  if (!testErr) {
    return NextResponse.json({
      success: true,
      message: "Database already set up! Tables exist.",
    });
  }

  // Tables don't exist yet — we need to run migration
  // Since PostgREST can't run DDL, return instructions
  return NextResponse.json({
    success: false,
    message: "Tables not found. Database migration needed.",
    instructions: [
      "1. Go to your Supabase Dashboard: " + supabaseUrl.replace('.supabase.co', '.supabase.co'),
      "2. Click 'SQL Editor' in the left sidebar",
      "3. Click 'New query'",
      "4. Paste the migration SQL (see /supabase/migrations/001_initial_schema.sql)",
      "5. Click 'Run'",
      "Or use: ./scripts/migrate.sh 'postgresql://postgres.lqxshsvfjtfxdbqtfbxa:YOUR_DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres'",
    ],
  });
}

// GET /api/setup — check database status
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ status: "not_configured" });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tables = [
    "users",
    "tracked_accounts",
    "videos",
    "metrics_snapshots",
    "account_snapshots",
    "collections",
    "collection_items",
    "content_ideas",
    "content_scripts",
    "content_reviews",
    "publishing_queue",
    "trends",
    "templates",
    "agent_conversations",
  ];

  const results: Record<string, boolean> = {};

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    results[table] = !error || error.code !== "PGRST116";
  }

  const allReady = Object.values(results).every(Boolean);

  return NextResponse.json({
    status: allReady ? "ready" : "needs_migration",
    tables: results,
    supabaseUrl,
  });
}
