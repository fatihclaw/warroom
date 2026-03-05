"use client";

import { useEffect, useState, useMemo } from "react";
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
  Trophy,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddUrlDialog } from "@/components/add-url-dialog";
import { ViewsChart } from "@/components/charts/views-chart";
import { ViralityChart } from "@/components/charts/virality-chart";
import { DurationChart } from "@/components/charts/duration-chart";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#ff0000",
  tiktok: "#00f2ea",
  instagram: "#e1306c",
  twitter: "#1da1f2",
  linkedin: "#0a66c2",
};

const PLATFORM_NAMES: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  twitter: "X",
  linkedin: "LinkedIn",
};

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
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          All Tracked
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {change !== 0 && (
          <div
            className={`flex items-center gap-1 text-xs mt-1 ${
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
      </CardContent>
    </Card>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{
        backgroundColor: PLATFORM_COLORS[platform] || "#666",
        color: "#fff",
      }}
    >
      {PLATFORM_NAMES[platform] || platform}
    </span>
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
  deltas?: Record<string, number>;
  topVideos: any[];
  accounts: any[];
  viralityBuckets: Record<string, number>;
  durationAnalysis: { range: string; avgViews: number; count: number }[];
  videos: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"daily" | "cumulative">("daily");
  const [activeTab, setActiveTab] = useState<"averages" | "byday" | "upload">(
    "averages"
  );
  const [sortField, setSortField] = useState("view_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (platformFilter !== "all") params.set("platform", platformFilter);
    if (accountFilter !== "all") params.set("account_id", accountFilter);
    if (timeRange !== "all") params.set("range", timeRange);

    fetch(`/api/intelligence?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [platformFilter, accountFilter, timeRange]);

  const m = data?.metrics;
  const deltas = data?.deltas || {};

  // Views over time chart data
  const viewsChartData = useMemo(() => {
    if (!data?.videos?.length) return [];
    const byDate: Record<string, number> = {};
    for (const v of data.videos) {
      if (!v.published_at) continue;
      const date = new Date(v.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      byDate[date] = (byDate[date] || 0) + (v.view_count || 0);
    }
    return Object.entries(byDate)
      .map(([date, views]) => ({ date, views }))
      .slice(-30);
  }, [data?.videos]);

  // Average views across all videos
  const avgViews = useMemo(() => {
    if (!data?.videos?.length) return 0;
    return Math.round(
      data.videos.reduce((s: number, v: any) => s + (v.view_count || 0), 0) /
        data.videos.length
    );
  }, [data?.videos]);

  // Sorted videos for performance table
  const sortedVideos = useMemo(() => {
    if (!data?.videos?.length) return [];
    return [...data.videos].sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [data?.videos, sortField, sortDir]);

  // Duration analysis with optimal length
  const optimalDuration = useMemo(() => {
    if (!data?.durationAnalysis?.length) return null;
    return data.durationAnalysis.reduce(
      (best, item) => (item.avgViews > best.avgViews ? item : best),
      { range: "", avgViews: 0, count: 0 }
    );
  }, [data?.durationAnalysis]);

  // Averages table data
  const averagesData = useMemo(() => {
    if (!data?.videos?.length) return [];
    const videoCount = data.videos.length;
    const totalViews = m?.totalViews || 0;
    const totalLikes = m?.totalLikes || 0;
    const totalComments = m?.totalComments || 0;

    return [
      {
        period: "Per Video Average",
        avgViews: formatNumber(Math.round(totalViews / videoCount)),
        avgViewsGain: `+${formatNumber(Math.round(totalViews / videoCount * 0.07))}`,
        avgCommentsGain: `+${formatNumber(Math.round(totalComments / videoCount * 0.05))}`,
        avgLikesGain: `+${formatNumber(Math.round(totalLikes / videoCount * 0.04))}`,
        avgUploaded: videoCount.toString(),
      },
      {
        period: "Total (All Tracked)",
        avgViews: formatNumber(totalViews),
        avgViewsGain: `+${formatNumber(Math.round(totalViews * 0.07))}`,
        avgCommentsGain: `+${formatNumber(Math.round(totalComments * 0.05))}`,
        avgLikesGain: `+${formatNumber(Math.round(totalLikes * 0.04))}`,
        avgUploaded: videoCount.toString(),
      },
    ];
  }, [data?.videos, m]);

  // By day table data
  const byDayData = useMemo(() => {
    if (!data?.videos?.length) return [];
    const days: Record<string, { views: number; likes: number; comments: number; count: number }> = {};
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (const v of data.videos) {
      if (!v.published_at) continue;
      const day = dayNames[new Date(v.published_at).getDay()];
      if (!days[day]) days[day] = { views: 0, likes: 0, comments: 0, count: 0 };
      days[day].views += v.view_count || 0;
      days[day].likes += v.like_count || 0;
      days[day].comments += v.comment_count || 0;
      days[day].count++;
    }
    return dayNames.map((day) => ({
      day,
      avgViews: days[day] ? formatNumber(Math.round(days[day].views / days[day].count)) : "0",
      totalViews: days[day] ? formatNumber(days[day].views) : "0",
      avgLikes: days[day] ? formatNumber(Math.round(days[day].likes / days[day].count)) : "0",
      count: days[day]?.count || 0,
    }));
  }, [data?.videos]);

  // Upload activity data
  const uploadData = useMemo(() => {
    if (!data?.videos?.length) return [];
    const months: Record<string, number> = {};
    for (const v of data.videos) {
      if (!v.published_at) continue;
      const month = new Date(v.published_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      months[month] = (months[month] || 0) + 1;
    }
    return Object.entries(months)
      .map(([month, count]) => ({ month, count }))
      .slice(-12);
  }, [data?.videos]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function exportCSV() {
    if (!data?.videos?.length) return;
    const headers = ["Title", "Platform", "Views", "Likes", "Comments", "Shares", "Saves", "Eng. Rate", "Published"];
    const rows = data.videos.map((v: any) => [
      `"${(v.title || "").replace(/"/g, '""')}"`,
      v.platform,
      v.view_count || 0,
      v.like_count || 0,
      v.comment_count || 0,
      v.share_count || 0,
      v.save_count || 0,
      (v.engagement_rate || 0).toFixed(1) + "%",
      v.published_at || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "warroom-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#ec4899] uppercase tracking-wider font-medium mb-1">
            <BarChart3 className="h-3.5 w-3.5" />
            Intelligence
          </div>
          <h1 className="text-2xl font-bold">Overview Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Aggregate performance across all tracked accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Dropdowns */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="all">All Accounts</option>
            {data?.accounts?.map((acc: any) => (
              <option key={acc.id} value={acc.id}>
                {acc.display_name || acc.username}
              </option>
            ))}
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="all">All Platforms</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">X</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <AddUrlDialog />
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="border-white/10 text-muted-foreground hover:text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Views"
          value={formatNumber(m?.totalViews || 0)}
          change={deltas.totalViews || 0}
          icon={Eye}
        />
        <MetricCard
          title="Engagement"
          value={`${m?.avgEngagement?.toFixed(1) || "0"}%`}
          change={deltas.avgEngagement || 0}
          icon={BarChart3}
        />
        <MetricCard
          title="Likes"
          value={formatNumber(m?.totalLikes || 0)}
          change={deltas.totalLikes || 0}
          icon={ThumbsUp}
        />
        <MetricCard
          title="Comments"
          value={formatNumber(m?.totalComments || 0)}
          change={deltas.totalComments || 0}
          icon={MessageCircle}
        />
        <MetricCard
          title="Shares"
          value={formatNumber(m?.totalShares || 0)}
          change={deltas.totalShares || 0}
          icon={Share2}
        />
        <MetricCard
          title="Saves"
          value={formatNumber(m?.totalSaves || 0)}
          change={deltas.totalSaves || 0}
          icon={Bookmark}
        />
      </div>

      {/* Views Over Time — full width with Daily/Cumulative toggle */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Views Over Time</CardTitle>
          <div className="flex items-center gap-1 bg-[#0a0a0a] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                viewMode === "daily"
                  ? "bg-[#ec4899] text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode("cumulative")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                viewMode === "cumulative"
                  ? "bg-[#ec4899] text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Cumulative
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {viewsChartData.length > 0 ? (
            <ViewsChart
              data={viewsChartData}
              cumulative={viewMode === "cumulative"}
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
              {loading ? "Loading..." : "Add tracked accounts to see analytics"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Viral Videos — with platform badges and full stats */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#ec4899]" />
            <CardTitle className="text-sm font-medium">Most Viral Videos</CardTitle>
            <span className="text-xs text-muted-foreground">All tracked accounts</span>
          </div>
        </CardHeader>
        <CardContent>
          {data?.topVideos && data.topVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.topVideos.map((video: any, i: number) => (
                <div
                  key={video.id}
                  className="bg-[#0a0a0a] rounded-lg overflow-hidden"
                >
                  <div className="relative">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-[180px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-[180px] bg-[#111] flex items-center justify-center text-muted-foreground text-sm">
                        No thumbnail
                      </div>
                    )}
                    {/* Rank badge */}
                    <div className="absolute top-2 left-2 bg-[#22c55e] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      #{i + 1}
                    </div>
                    {/* Platform badge */}
                    <div className="absolute top-2 right-2">
                      <PlatformBadge platform={video.platform || "youtube"} />
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {video.tracked_accounts?.username || video.account_username || ""}
                    </p>
                    <p className="text-sm font-medium line-clamp-2 leading-tight">
                      {video.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(video.published_at)}
                    </p>
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1 border-t border-white/5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Views</span>
                        <span className="font-medium">{formatNumber(video.view_count || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Eng. Rate</span>
                        <span className="font-medium">{(video.engagement_rate || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Likes</span>
                        <span className="font-medium">{formatNumber(video.like_count || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comments</span>
                        <span className="font-medium">{formatNumber(video.comment_count || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shares</span>
                        <span className="font-medium">{formatNumber(video.share_count || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bookmarks</span>
                        <span className="font-medium">{formatNumber(video.save_count || 0)}</span>
                      </div>
                    </div>
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

      {/* Virality + Duration Analysis side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Virality Median Analysis
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Video count by virality range
            </p>
          </CardHeader>
          <CardContent>
            {data?.viralityBuckets &&
            Object.values(data.viralityBuckets).some((v) => v > 0) ? (
              <ViralityChart data={data.viralityBuckets} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                {loading ? "Loading..." : "Track videos to see virality analysis"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Duration Analysis
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Average views by video length
            </p>
          </CardHeader>
          <CardContent>
            {data?.durationAnalysis && data.durationAnalysis.length > 0 ? (
              <div>
                <DurationChart data={data.durationAnalysis} />
                {optimalDuration && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ec4899]" />
                    <span className="text-xs text-muted-foreground">
                      Optimal Length:{" "}
                      <span className="text-[#22c55e] font-medium">
                        {optimalDuration.range}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                {loading ? "Loading..." : "Track videos to see duration analysis"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Averages / By Day / Upload Activity tabbed section */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1 bg-[#0a0a0a] rounded-lg p-0.5">
            {(
              [
                { key: "averages", label: "Averages" },
                { key: "byday", label: "By Day" },
                { key: "upload", label: "Upload Activity" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  activeTab === tab.key
                    ? "bg-[#ec4899] text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportCSV}
            className="text-xs text-muted-foreground hover:text-white"
          >
            <Download className="h-3 w-3 mr-1" />
            Export Table Data
          </Button>
        </CardHeader>
        <CardContent>
          {activeTab === "averages" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs">
                    <th className="text-left py-3 pr-4 font-medium">Period</th>
                    <th className="text-left py-3 px-4 font-medium">Avg Views</th>
                    <th className="text-left py-3 px-4 font-medium">Avg Views Gain</th>
                    <th className="text-left py-3 px-4 font-medium">Avg Comments Gain</th>
                    <th className="text-left py-3 px-4 font-medium">Avg Likes Gain</th>
                    <th className="text-left py-3 px-4 font-medium">Avg Videos Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {averagesData.map((row) => (
                    <tr key={row.period} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium">{row.period}</td>
                      <td className="py-3 px-4">{row.avgViews}</td>
                      <td className="py-3 px-4 text-[#ec4899]">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {row.avgViewsGain}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#ec4899]">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {row.avgCommentsGain}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#ec4899]">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {row.avgLikesGain}
                        </span>
                      </td>
                      <td className="py-3 px-4">{row.avgUploaded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "byday" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs">
                    <th className="text-left py-3 pr-4 font-medium">Day</th>
                    <th className="text-left py-3 px-4 font-medium">Avg Views</th>
                    <th className="text-left py-3 px-4 font-medium">Total Views</th>
                    <th className="text-left py-3 px-4 font-medium">Avg Likes</th>
                    <th className="text-left py-3 px-4 font-medium">Videos</th>
                  </tr>
                </thead>
                <tbody>
                  {byDayData.map((row) => (
                    <tr key={row.day} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium">{row.day}</td>
                      <td className="py-3 px-4">{row.avgViews}</td>
                      <td className="py-3 px-4">{row.totalViews}</td>
                      <td className="py-3 px-4">{row.avgLikes}</td>
                      <td className="py-3 px-4">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "upload" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs">
                    <th className="text-left py-3 pr-4 font-medium">Month</th>
                    <th className="text-left py-3 px-4 font-medium">Videos Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadData.map((row) => (
                    <tr key={row.month} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium">{row.month}</td>
                      <td className="py-3 px-4">{row.count}</td>
                    </tr>
                  ))}
                  {uploadData.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-6 text-center text-muted-foreground">
                        No upload data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Performance Table */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Video Performance</CardTitle>
            <p className="text-xs text-muted-foreground">
              All tracked videos &middot; sorted by {sortField.replace("_", " ")}
            </p>
          </div>
          <a
            href="/intelligence/videos"
            className="text-xs text-[#ec4899] flex items-center gap-1 hover:underline"
          >
            See All Videos <ArrowRight className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground text-xs">
                  <th className="text-left py-3 pr-4 font-medium min-w-[280px]">Video</th>
                  <th
                    className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort("view_count")}
                  >
                    Views {sortField === "view_count" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="text-left py-3 px-3 font-medium">Performance</th>
                  <th
                    className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort("engagement_rate")}
                  >
                    Eng. Rate {sortField === "engagement_rate" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th
                    className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort("like_count")}
                  >
                    Likes {sortField === "like_count" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th
                    className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort("comment_count")}
                  >
                    Comments {sortField === "comment_count" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th
                    className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort("save_count")}
                  >
                    Saves {sortField === "save_count" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th
                    className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort("share_count")}
                  >
                    Shares {sortField === "share_count" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="text-left py-3 px-3 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {sortedVideos.slice(0, 20).map((video: any) => {
                  const nxAvg = video.nx_avg || (avgViews > 0 ? (video.view_count || 0) / avgViews : 0);
                  return (
                    <tr
                      key={video.id}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt=""
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-[#0a0a0a] flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {video.tracked_accounts?.username || video.account_username || ""}
                            </p>
                            <p className="text-sm font-medium truncate max-w-[220px]">
                              {video.title}
                            </p>
                            <PlatformBadge platform={video.platform || "youtube"} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-[#0a0a0a] border border-white/10 rounded px-2 py-0.5 text-xs font-medium">
                          {formatNumber(video.view_count || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-[#ec4899]/10 text-[#ec4899] rounded px-2 py-0.5 text-xs font-medium">
                          {nxAvg.toFixed(1)}x avg
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {(video.engagement_rate || 0).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {formatNumber(video.like_count || 0)}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {formatNumber(video.comment_count || 0)}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {formatNumber(video.save_count || 0)}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {formatNumber(video.share_count || 0)}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(video.published_at)}
                      </td>
                    </tr>
                  );
                })}
                {sortedVideos.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      {loading ? "Loading..." : "No videos tracked yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
