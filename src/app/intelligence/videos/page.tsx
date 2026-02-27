"use client";

import { useState, useEffect } from "react";
import { Video, Search, ExternalLink, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function platformBadge(platform: string) {
  const colors: Record<string, string> = {
    youtube: "bg-red-500/10 text-red-400 border-red-500/20",
    tiktok: "bg-white/10 text-white border-white/20",
    instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    twitter: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    linkedin: "bg-blue-600/10 text-blue-500 border-blue-600/20",
  };
  return colors[platform] || "bg-white/10 text-white border-white/20";
}

interface VideoData {
  id: string;
  title: string;
  platform: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  engagement_rate: number;
  nx_avg: number;
  video_url: string;
  thumbnail_url: string;
  published_at: string;
  tracked_accounts?: { username: string; platform: string };
}

export default function AllVideosPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [sort, setSort] = useState("view_count");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, order: "desc", limit: "100" });
    if (platform !== "all") params.set("platform", platform);
    if (search) params.set("search", search);

    fetch(`/api/videos?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.videos || []);
        setTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [platform, sort, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-[#ec4899]" />
            All Videos
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} videos tracked across all platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="pl-9 bg-[#1a1a2e] border-white/10"
            />
          </div>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[140px] bg-[#1a1a2e] border-white/10">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">X/Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#1a1a2e] border-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Video</TableHead>
                <TableHead
                  className="text-muted-foreground text-right cursor-pointer"
                  onClick={() => setSort("view_count")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Views <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead
                  className="text-muted-foreground text-right cursor-pointer"
                  onClick={() => setSort("nx_avg")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Performance <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Eng. Rate
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Likes
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Comments
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Uploaded
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-16"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : videos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-16"
                  >
                    No videos tracked yet. Add a URL from the dashboard.
                  </TableCell>
                </TableRow>
              ) : (
                videos.map((video) => (
                  <TableRow key={video.id} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {video.thumbnail_url && (
                          <img
                            src={video.thumbnail_url}
                            alt=""
                            className="w-16 h-10 object-cover rounded"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[300px]">
                            {video.title || "Untitled"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${platformBadge(video.platform)}`}
                            >
                              {video.platform}
                            </Badge>
                            {video.video_url && (
                              <a
                                href={video.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#ec4899]"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(video.view_count)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={`${
                          video.nx_avg >= 10
                            ? "border-[#22c55e]/30 text-[#22c55e]"
                            : video.nx_avg >= 2
                            ? "border-[#ec4899]/30 text-[#ec4899]"
                            : "border-white/20 text-muted-foreground"
                        }`}
                      >
                        {video.nx_avg}x avg
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {video.engagement_rate?.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(video.like_count)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(video.comment_count)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {video.published_at
                        ? new Date(video.published_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
