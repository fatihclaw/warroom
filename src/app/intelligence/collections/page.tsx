"use client";

import { useState, useEffect } from "react";
import {
  FolderHeart,
  Plus,
  Loader2,
  Trash2,
  FolderOpen,
  Video,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  item_count: number;
  created_at: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  function fetchCollections() {
    setLoading(true);
    fetch("/api/collections")
      .then((r) => r.json())
      .then((d) => setCollections(d.collections || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setName("");
        setDescription("");
        fetchCollections();
      }
    } catch {
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
      fetchCollections();
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderHeart className="h-6 w-6 text-[#ec4899]" />
            Collections
          </h1>
          <p className="text-sm text-muted-foreground">
            Saved groups of content for reference and inspiration
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#ec4899] hover:bg-[#be185d] text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a2e] border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hook Ideas, Competitor Wins..."
                  className="bg-[#0a0a0a] border-white/10"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this collection for?"
                  className="bg-[#0a0a0a] border-white/10"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="w-full bg-[#ec4899] hover:bg-[#be185d] text-white"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#ec4899]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Card
              key={col.id}
              className="bg-[#1a1a2e] border-white/5 hover:border-[#ec4899]/20 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-[#ec4899] shrink-0" />
                    <div>
                      <p className="font-medium">{col.name}</p>
                      {col.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {col.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-[#ef4444]"
                    onClick={() => handleDelete(col.id)}
                    disabled={deleting === col.id}
                  >
                    {deleting === col.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Video className="h-3 w-3" />
                  {col.item_count} items
                  <span className="ml-auto">
                    {new Date(col.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create new card */}
          <Card
            className="bg-[#1a1a2e] border-white/5 border-dashed border-2 flex items-center justify-center min-h-[140px] cursor-pointer hover:border-[#ec4899]/30 transition-colors"
            onClick={() => setDialogOpen(true)}
          >
            <CardContent className="text-center p-6">
              <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {collections.length === 0
                  ? "Create your first collection"
                  : "New collection"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
