"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewsChart } from "@/components/charts/views-chart";
import { ViralityChart } from "@/components/charts/virality-chart";
import { DurationChart } from "@/components/charts/duration-chart";

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

export default function IntelligenceOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("all-platforms");
  const [accountId, setAccountId] = useState("all");
  const [timeRange, setTimeRange] = useState("30d");

  function fetchData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (platform !== "all-platforms") params.set("platform", platform);
    if (accountId !== "all") params.set("account_id", accountId);
    params.set("range", timeRange);

    fetch(`/api/intelligence?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, [platform, accountId, timeRange]);

  const m = data?.metrics;

  // Prepare chart data
  const viralityData: Record<string, number> = data?.viralityBuckets || {};

  const durationData = data?.durationAnalysis || [];

  // Build views chart data from videos
  const viewsData = (() => {
    if (!data?.videos?.length) return [];
    const byDate: Record<string, number> = {};
    for (const v of data.videos) {
      if (!v.published_at) continue;
      const date = new Date(v.published_at).toISOString().split("T")[0];
      byDate[date] = (byDate[date] || 0) + (v.view_count || 0);
    }
    return Object.entries(byDate)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Export CSV
  function exportCSV() {
    if (!data?.videos?.length) return;
    const headers = "Title,Platform,Views,Likes,Comments,Shares,Published\n";
    const rows = data.videos
      .map(
        (v: any) =>
          `"${(v.title || "").replace(/"/g, '""')}",${v.platform},${v.view_count || 0},${v.like_count || 0},${v.comment_count || 0},${v.share_count || 0},${v.published_at || ""}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "warroom-intelligence.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Statistics: averages
  const avgViews =
    data?.videos?.length > 0
      ? Math.round(
          data.videos.reduce((s: number, v: any) => s + (v.view_count || 0), 0) /
            data.videos.length
        )
      : 0;
  const avgLikes =
    data?.videos?.length > 0
      ? Math.round(
          data.videos.reduce((s: number, v: any) => s + (v.like_count || 0), 0) /
            data.videos.length
        )
      : 0;
  const avgComments =
    data?.videos?.length > 0
      ? Math.round(
          data.videos.reduce(
            (s: number, v: any) => s + (v.comment_count || 0),
            0
          ) / data.videos.length
        )
      : 0;

  // By day stats
  const byDay = (() => {
    if (!data?.videos?.length) return [];
    const days: Record<string, { count: number; views: number }> = {};
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (const v of data.videos) {
      if (!v.published_at) continue;
      const d = dayNames[new Date(v.published_at).getDay()];
      if (!days[d]) days[d] = { count: 0, views: 0 };
      days[d].count++;
      days[d].views += v.view_count || 0;
    }
    return dayNames.map((name) => ({
      day: name,
      uploads: days[name]?.count || 0,
      avgViews: days[name]?.count
        ? Math.round(days[name].views / days[name].count)
        : 0,
    }));
  })();

  return (
    <div className="p-6 space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#ec4899]" />
            Intelligence Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Aggregate analytics across all tracked accounts
            {m ? ` — ${m.videoCount} videos tracked` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-[160px] bg-[#1a1a2e] border-white/10">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all">All Accounts</SelectItem>
              {data?.accounts?.map((acc: any) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.display_name || acc.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[140px] bg-[#1a1a2e] border-white/10">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all-platforms">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">X/Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] bg-[#1a1a2e] border-white/10">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="border-white/10"
            onClick={fetchData}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-white/10"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Views"
          value={formatNumber(m?.totalViews || 0)}
          change={0}
          icon={Eye}
        />
        <MetricCard
          title="Eng. Rate"
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Views Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viewsData.length > 0 ? (
              <ViewsChart data={viewsData} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Add tracked accounts to see view trends"
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Virality Median Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.values(viralityData).some((c) => c > 0) ? (
              <ViralityChart data={viralityData} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Track videos to see virality distribution"
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Viral + Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Viral Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topVideos?.length > 0 ? (
              <div className="space-y-3">
                {data.topVideos.map((v: any, i: number) => (
                  <div key={v.id} className="flex items-center gap-3 bg-[#0a0a0a] rounded-lg p-3">
                    <span className="text-lg font-bold text-muted-foreground/30 w-6 text-center">
                      {i + 1}
                    </span>
                    {v.thumbnail_url && (
                      <img
                        src={v.thumbnail_url}
                        alt=""
                        className="w-16 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {v.title || "Untitled"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{formatNumber(v.view_count || 0)} views</span>
                        {v.nx_avg && (
                          <Badge
                            variant="outline"
                            className="border-[#ec4899]/30 text-[#ec4899] text-xs"
                          >
                            {v.nx_avg}x avg
                          </Badge>
                        )}
                      </div>
                    </div>
                    {v.video_url && (
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ec4899]"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "No videos tracked yet"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duration Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {durationData.length > 0 ? (
              <DurationChart data={durationData} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Track videos to see optimal length"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics Table */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="averages">
            <TabsList className="bg-[#0a0a0a]">
              <TabsTrigger value="averages">Averages</TabsTrigger>
              <TabsTrigger value="by-day">By Day</TabsTrigger>
              <TabsTrigger value="upload-activity">Upload Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="averages" className="mt-4">
              {data?.videos?.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{formatNumber(avgViews)}</p>
                    <p className="text-xs text-muted-foreground">Avg Views</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{formatNumber(avgLikes)}</p>
                    <p className="text-xs text-muted-foreground">Avg Likes</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{formatNumber(avgComments)}</p>
                    <p className="text-xs text-muted-foreground">Avg Comments</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No data available yet
                </div>
              )}
            </TabsContent>
            <TabsContent value="by-day" className="mt-4">
              {byDay.some((d) => d.uploads > 0) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-2 text-muted-foreground font-medium">Day</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Uploads</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Avg Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDay.map((row) => (
                        <tr key={row.day} className="border-b border-white/5">
                          <td className="py-2">{row.day}</td>
                          <td className="text-right py-2">{row.uploads}</td>
                          <td className="text-right py-2">{formatNumber(row.avgViews)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No data available yet
                </div>
              )}
            </TabsContent>
            <TabsContent value="upload-activity" className="mt-4">
              {data?.videos?.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total videos</span>
                    <span className="font-medium">{data.videos.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accounts tracked</span>
                    <span className="font-medium">{data.accounts?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg videos/account</span>
                    <span className="font-medium">
                      {data.accounts?.length
                        ? (data.videos.length / data.accounts.length).toFixed(1)
                        : "0"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No data available yet
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
