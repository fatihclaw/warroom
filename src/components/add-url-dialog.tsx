"use client";

import { useState } from "react";
import { Plus, Link, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseSocialUrl, getPlatformName } from "@/lib/url-parser";

export function AddUrlDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsed = url ? parseSocialUrl(url) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) {
      setError("Could not recognize this URL. Try a YouTube, TikTok, Instagram, X, or LinkedIn URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: parsed.url,
          platform: parsed.platform,
          type: parsed.type,
          id: parsed.id,
          username: parsed.username,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to track URL");
      }

      setUrl("");
      setOpen(false);
      // TODO: refresh data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#ec4899] hover:bg-[#be185d] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add URL
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a2e] border-white/10 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Track Content</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Paste any social media URL — video, post, or profile
            </p>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError("");
                }}
                placeholder="https://youtube.com/watch?v=... or https://tiktok.com/@..."
                className="pl-9 bg-[#0a0a0a] border-white/10"
                autoFocus
              />
            </div>
          </div>

          {parsed && (
            <div className="flex items-center gap-2 text-sm">
              <Badge
                variant="outline"
                className="border-[#ec4899]/30 text-[#ec4899]"
              >
                {getPlatformName(parsed.platform)}
              </Badge>
              <span className="text-muted-foreground">
                {parsed.type === "profile" ? "Profile" : "Video/Post"}
                {parsed.username && ` — @${parsed.username}`}
              </span>
            </div>
          )}

          {error && <p className="text-sm text-[#ef4444]">{error}</p>}

          <Button
            type="submit"
            disabled={!parsed || loading}
            className="w-full bg-[#ec4899] hover:bg-[#be185d] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Tracking...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {parsed?.type === "profile"
                  ? "Track Account"
                  : "Track Content"}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
