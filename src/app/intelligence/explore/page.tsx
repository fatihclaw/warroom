"use client";

import { useState } from "react";
import {
  Compass,
  Search,
  Loader2,
  Users,
  Video,
  Eye,
  CheckCircle,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

interface SearchResult {
  id: string;
  platform: string;
  username: string;
  display_name: string;
  description: string;
  avatar_url: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  already_tracked: boolean;
  profile_url: string;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState<Set<string>>(new Set());

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/explore?q=${encodeURIComponent(query)}&platform=${platform}`
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results || []);
        if (data.message) setError(data.message);
      }
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function trackAccount(result: SearchResult) {
    setTracking((prev) => new Set([...prev, result.id]));
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: result.profile_url,
          platform: result.platform,
          type: "profile",
          id: result.id,
          username: result.username,
        }),
      });
      if (res.ok) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === result.id ? { ...r, already_tracked: true } : r
          )
        );
      }
    } catch {
    } finally {
      setTracking((prev) => {
        const next = new Set(prev);
        next.delete(result.id);
        return next;
      });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="h-6 w-6 text-[#ec4899]" />
          Explore
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover new accounts to track and analyze
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for channels, creators, or topics..."
            className="pl-9 bg-[#1a1a2e] border-white/10 h-11"
          />
        </div>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[130px] bg-[#1a1a2e] border-white/10 h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-white/10">
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="twitter">X/Twitter</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-[#ec4899] hover:bg-[#be185d] text-white h-11"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-[#f59e0b]">{error}</p>
      )}

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result) => (
            <Card key={result.id} className="bg-[#1a1a2e] border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {result.avatar_url && (
                    <img
                      src={result.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{result.display_name}</p>
                      <Badge
                        variant="outline"
                        className="border-[#ec4899]/30 text-[#ec4899] text-xs"
                      >
                        {result.platform}
                      </Badge>
                    </div>
                    {result.username && (
                      <p className="text-xs text-muted-foreground">
                        @{result.username}
                      </p>
                    )}
                    {result.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {result.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatNumber(result.subscriber_count)} subscribers
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {formatNumber(result.video_count)} videos
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(result.view_count)} total views
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {result.already_tracked ? (
                      <Button variant="outline" size="sm" disabled className="border-[#22c55e]/30 text-[#22c55e]">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Tracked
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-[#ec4899] hover:bg-[#be185d] text-white"
                        onClick={() => trackAccount(result)}
                        disabled={tracking.has(result.id)}
                      >
                        {tracking.has(result.id) ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 mr-1" />
                        )}
                        Track
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !loading && (
          <Card className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-10 text-center">
              <Compass className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Search for accounts or browse trending creators in your niche
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                YouTube search available now. Other platforms coming soon.
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
