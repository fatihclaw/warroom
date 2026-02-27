import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/collections — fetch all collections with item counts
export async function GET() {
  try {
    const { data: collections, error } = await supabase
      .from("collections")
      .select("*, collection_items(count)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const result = (collections || []).map((c) => ({
      ...c,
      item_count: c.collection_items?.[0]?.count || 0,
    }));

    return NextResponse.json({ collections: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// POST /api/collections — create a new collection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("collections")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, collection: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create collection" },
      { status: 500 }
    );
  }
}

// DELETE /api/collections — delete a collection
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Delete items first
    await supabase.from("collection_items").delete().eq("collection_id", id);

    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete collection" },
      { status: 500 }
    );
  }
}
