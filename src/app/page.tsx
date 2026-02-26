"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddUrlDialog } from "@/components/add-url-dialog";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
}) {
  const isPositive = change >= 0;
  return (
    <Card className="bg-[#1a1a2e] border-white/5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Icon className="h-4 w-4" />
            {title}
          </div>
          {change !== 0 && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                isPositive ? "text-[#22c55e]" : "text-[#ef4444]"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isPositive ? "+" : ""}
              {change}%
            </div>
          )}
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

interface IntelData {
  metrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    avgEngagement: number;
    videoCount: number;
  };
  topVideos: any[];
  accounts: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/intelligence")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const m = data?.metrics;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Content Intelligence Overview
            {data?.accounts?.length
              ? ` — ${data.accounts.length} accounts, ${m?.videoCount || 0} videos`
              : ""}
          </p>
        </div>
        <AddUrlDialog />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Views"
          value={formatNumber(m?.totalViews || 0)}
          change={0}
          icon={Eye}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${m?.avgEngagement?.toFixed(1) || "0"}%`}
          change={0}
          icon={BarChart3}
        />
        <MetricCard
          title="Likes"
          value={formatNumber(m?.totalLikes || 0)}
          change={0}
          icon={ThumbsUp}
        />
        <MetricCard
          title="Comments"
          value={formatNumber(m?.totalComments || 0)}
          change={0}
          icon={MessageCircle}
        />
        <MetricCard
          title="Shares"
          value={formatNumber(m?.totalShares || 0)}
          change={0}
          icon={Share2}
        />
        <MetricCard
          title="Saves"
          value={formatNumber(m?.totalSaves || 0)}
          change={0}
          icon={Bookmark}
        />
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Views Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
              {loading
                ? "Loading..."
                : "Add tracked accounts to see analytics"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Virality Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
              {loading
                ? "Loading..."
                : "Track videos to see virality analysis"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Viral Videos */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Most Viral Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.topVideos && data.topVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.topVideos.map((video: any) => (
                <div
                  key={video.id}
                  className="bg-[#0a0a0a] rounded-lg overflow-hidden"
                >
                  {video.thumbnail_url && (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-[140px] object-cover"
                    />
                  )}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium line-clamp-2">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="border-[#ec4899]/30 text-[#ec4899] text-xs"
                      >
                        {video.nx_avg}x avg
                      </Badge>
                      <span>{formatNumber(video.view_count)} views</span>
                    </div>
                    {video.video_url && (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#ec4899] flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Watch
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              {loading ? "Loading..." : "No videos tracked yet"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
