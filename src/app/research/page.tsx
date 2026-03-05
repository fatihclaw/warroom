"use client";

import { useState, useEffect } from "react";
import {
  Radar,
  TrendingUp,
  Music,
  Hash,
  Film,
  Eye,
  Loader2,
  ExternalLink,
  RefreshCw,
  Globe,
  Search,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface TrendingVideo {
  id: string;
  title: string;
  platform: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  thumbnail_url: string;
  video_url: string;
  published_at: string;
  nx_avg: number;
  account_avg: number;
  tracked_accounts?: { username: string; display_name: string; platform: string };
}

interface Hashtag {
  tag: string;
  count: number;
  totalViews: number;
  avgViews: number;
}

interface Format {
  name: string;
  count: number;
  avgViews: number;
  totalViews: number;
}

interface DiscoverVideo {
  id: string;
  platform: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  channelTitle: string;
  viewsPerHour: number;
  hashtags: string[];
  engagementRate: number;
  ageHours: number;
  source: string;
  url: string;
  extra?: Record<string, any>;
}

export default function ResearchPage() {
  const [trending, setTrending] = useState<TrendingVideo[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [platform, setPlatform] = useState("all");

  // Discovery state
  const [discoverVideos, setDiscoverVideos] = useState<DiscoverVideo[]>([]);
  const [discoverHashtags, setDiscoverHashtags] = useState<{ tag: string; count: number; totalViews: number }[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverCategory, setDiscoverCategory] = useState("all");
  const [discoverRegion, setDiscoverRegion] = useState("US");
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([]);
  const [activeTab, setActiveTab] = useState("discovery");
  const [discoverPlatform, setDiscoverPlatform] = useState("all");
  const [discoverErrors, setDiscoverErrors] = useState<Record<string, string>>({});

  function fetchTrends() {
    setLoading(true);
    fetch(`/api/trends?period=${period}&platform=${platform}`)
      .then((r) => r.json())
      .then((d) => {
        setTrending(d.trending || []);
        setHashtags(d.hashtags || []);
        setFormats(d.formats || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function fetchDiscovery(source = "trending") {
    setDiscoverLoading(true);
    setDiscoverErrors({});
    const params = new URLSearchParams({ source, region: discoverRegion, platform: discoverPlatform });
    if (discoverCategory !== "all") params.set("category", discoverCategory);
    if (discoverQuery) params.set("query", discoverQuery);

    fetch(`/api/discover?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          console.error(d.error);
          return;
        }
        setDiscoverVideos(d.videos || []);
        setDiscoverHashtags(d.hashtags || []);
        if (d.errors) setDiscoverErrors(d.errors);
      })
      .catch(() => {})
      .finally(() => setDiscoverLoading(false));
  }

  function fetchCategories() {
    fetch(`/api/discover?categories=true&region=${discoverRegion}`)
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }

  useEffect(() => {
    fetchTrends();
  }, [period, platform]);

  useEffect(() => {
    fetchCategories();
    fetchDiscovery("trending");
  }, [discoverRegion]);

  function formatAge(hours: number): string {
    if (hours < 1) return "< 1h ago";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radar className="h-6 w-6 text-[#ec4899]" />
            Trend Radar
          </h1>
          <p className="text-sm text-muted-foreground">
            What&apos;s going viral right now
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[140px] bg-[#1a1a2e] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">X/Twitter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px] bg-[#1a1a2e] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="border-white/10"
            onClick={fetchTrends}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1a1a2e]">
          <TabsTrigger value="discovery">
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Discovery
          </TabsTrigger>
          <TabsTrigger value="content">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Tracked Trends
          </TabsTrigger>
          <TabsTrigger value="sounds">
            <Music className="h-3.5 w-3.5 mr-1.5" />
            Sounds
          </TabsTrigger>
          <TabsTrigger value="hashtags">
            <Hash className="h-3.5 w-3.5 mr-1.5" />
            Hashtags
          </TabsTrigger>
          <TabsTrigger value="formats">
            <Film className="h-3.5 w-3.5 mr-1.5" />
            Formats
          </TabsTrigger>
        </TabsList>

        {/* DISCOVERY — Platform-wide YouTube trending */}
        <TabsContent value="discovery" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search viral videos..."
                  className="pl-9 bg-[#1a1a2e] border-white/10"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && discoverQuery.trim()) {
                      fetchDiscovery(discoverQuery ? "all" : "trending");
                    }
                  }}
                />
              </div>
            </div>
            <Select value={discoverPlatform} onValueChange={setDiscoverPlatform}>
              <SelectTrigger className="w-[130px] bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="twitter">X / Twitter</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
            {discoverPlatform === "youtube" || discoverPlatform === "all" ? (
              <Select value={discoverCategory} onValueChange={setDiscoverCategory}>
                <SelectTrigger className="w-[160px] bg-[#1a1a2e] border-white/10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-[300px]">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Select value={discoverRegion} onValueChange={setDiscoverRegion}>
              <SelectTrigger className="w-[100px] bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="GB">UK</SelectItem>
                <SelectItem value="IN">India</SelectItem>
                <SelectItem value="BR">Brazil</SelectItem>
                <SelectItem value="JP">Japan</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-[#ec4899] hover:bg-[#ec4899]/80 text-white"
              onClick={() => fetchDiscovery(discoverQuery ? "all" : "trending")}
              disabled={discoverLoading}
            >
              {discoverLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Flame className="h-4 w-4 mr-1.5" />
              )}
              Discover
            </Button>
          </div>

          {discoverLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#ec4899]" />
            </div>
          ) : discoverVideos.length > 0 ? (
            <>
              {/* Platform error notices */}
              {Object.keys(discoverErrors).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(discoverErrors).map(([plat, msg]) => (
                    <Badge
                      key={plat}
                      variant="outline"
                      className="border-amber-500/30 text-amber-400 text-xs"
                    >
                      {plat}: {msg.substring(0, 60)}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Discovery hashtags bar */}
              {discoverHashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {discoverHashtags.slice(0, 12).map((ht) => (
                    <Badge
                      key={ht.tag}
                      variant="outline"
                      className="border-[#ec4899]/30 text-[#ec4899] cursor-pointer hover:bg-[#ec4899]/10"
                      onClick={() => {
                        setDiscoverQuery(ht.tag);
                        fetchDiscovery("search");
                      }}
                    >
                      {ht.tag} ({ht.count})
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {discoverVideos.map((video, i) => (
                  <Card key={video.id} className="bg-[#1a1a2e] border-white/5">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="text-2xl font-bold text-muted-foreground/30 w-8 text-center shrink-0 self-center">
                          {i + 1}
                        </div>
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="w-[120px] h-[68px] rounded object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {video.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                video.platform === "youtube"
                                  ? "border-red-500/30 text-red-400"
                                  : video.platform === "twitter"
                                  ? "border-blue-400/30 text-blue-400"
                                  : video.platform === "tiktok"
                                  ? "border-cyan-400/30 text-cyan-400"
                                  : "border-white/10"
                              }`}
                            >
                              {video.platform}
                            </Badge>
                            <span>{video.channelTitle}</span>
                            <span>{formatAge(video.ageHours)}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatNumber(video.viewCount)}
                            </span>
                            <span className="flex items-center gap-1 text-[#ec4899] font-bold">
                              <Flame className="h-3 w-3" />
                              {formatNumber(video.viewsPerHour)}/hr
                            </span>
                            <span className="text-muted-foreground">
                              {video.engagementRate.toFixed(1)}% eng.
                            </span>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#ec4899] hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardContent className="p-10 text-center">
                <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Discover what&apos;s trending on YouTube — no tracked accounts needed
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  Click &quot;Discover&quot; to fetch trending videos, or search by keyword
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TRACKED TRENDS (formerly "Trending Content") */}
        <TabsContent value="content" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#ec4899]" />
            </div>
          ) : trending.length > 0 ? (
            <div className="space-y-3">
              {trending.map((video, i) => (
                <Card key={video.id} className="bg-[#1a1a2e] border-white/5">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="text-2xl font-bold text-muted-foreground/30 w-8 text-center shrink-0 self-center">
                        {i + 1}
                      </div>
                      {video.thumbnail_url && (
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="w-[120px] h-[68px] rounded object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">
                          {video.title || "Untitled"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="border-[#ec4899]/30 text-[#ec4899] text-xs"
                          >
                            {video.platform}
                          </Badge>
                          {video.tracked_accounts?.username && (
                            <span>@{video.tracked_accounts.username}</span>
                          )}
                          {video.published_at && (
                            <span>
                              {new Date(video.published_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(video.view_count)}
                          </span>
                          <span
                            className={`font-bold ${
                              video.nx_avg >= 5
                                ? "text-[#ec4899]"
                                : video.nx_avg >= 2
                                ? "text-[#22c55e]"
                                : "text-muted-foreground"
                            }`}
                          >
                            {video.nx_avg}x avg
                          </span>
                          {video.video_url && (
                            <a
                              href={video.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#ec4899] hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> Watch
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardContent className="p-10 text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Start tracking accounts to discover trending content
                </p>
                <Badge className="mt-3 bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/20">
                  Add accounts in Intelligence → Accounts
                </Badge>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SOUNDS */}
        <TabsContent value="sounds" className="mt-6">
          <Card className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-10 text-center">
              <Music className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Trending sounds require TikTok/Instagram scraping via OpenClaw
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Coming in Phase 6 — browser automation integration
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HASHTAGS */}
        <TabsContent value="hashtags" className="mt-6">
          {hashtags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hashtags.map((ht) => (
                <Card key={ht.tag} className="bg-[#1a1a2e] border-white/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#ec4899]">{ht.tag}</p>
                      <p className="text-xs text-muted-foreground">
                        {ht.count} videos · {formatNumber(ht.avgViews)} avg views
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatNumber(ht.totalViews)}
                      </p>
                      <p className="text-xs text-muted-foreground">total views</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardContent className="p-10 text-center">
                <Hash className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Hashtag trends extracted from tracked video titles and descriptions
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* FORMATS */}
        <TabsContent value="formats" className="mt-6">
          {formats.some((f) => f.count > 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {formats.map((fmt) => {
                const maxAvg = Math.max(...formats.map((f) => f.avgViews), 1);
                const barWidth = (fmt.avgViews / maxAvg) * 100;
                return (
                  <Card key={fmt.name} className="bg-[#1a1a2e] border-white/5">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium mb-1">{fmt.name}</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(fmt.avgViews)}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        avg views · {fmt.count} videos
                      </p>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                          className="bg-[#ec4899] h-2 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardContent className="p-10 text-center">
                <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Format analysis based on video duration of tracked content
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
