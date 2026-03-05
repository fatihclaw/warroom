"use client";

import { useEffect, useState } from "react";
import {
  Twitter,
  TrendingUp,
  TrendingDown,
  Users,
  MessageCircle,
  Heart,
  Eye,
  ExternalLink,
  Loader2,
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

export default function XIntelligencePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccounts, setHasAccounts] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/intelligence?platform=twitter").then((r) => r.json()),
      fetch("/api/videos?platform=twitter&limit=20").then((r) => r.json()),
    ])
      .then(([intel, vids]) => {
        setData({ ...intel, recentVideos: vids.videos || [] });
        setHasAccounts(
          (intel.accounts || []).some(
            (a: any) => a.platform === "twitter"
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const m = data?.metrics;
  const deltas = data?.deltas || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#ec4899]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Twitter className="h-6 w-6 text-[#ec4899]" />
            X Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Deep analytics for X/Twitter
          </p>
        </div>
        <AddUrlDialog />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Views",
            value: formatNumber(m?.totalViews || 0),
            change: deltas.totalViews || 0,
            icon: Eye,
          },
          {
            title: "Likes",
            value: formatNumber(m?.totalLikes || 0),
            change: deltas.totalLikes || 0,
            icon: Heart,
          },
          {
            title: "Comments",
            value: formatNumber(m?.totalComments || 0),
            change: deltas.totalComments || 0,
            icon: MessageCircle,
          },
          {
            title: "Engagement",
            value: `${m?.avgEngagement?.toFixed(1) || "0"}%`,
            change: deltas.avgEngagement || 0,
            icon: TrendingUp,
          },
        ].map((metric) => (
          <Card key={metric.title} className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <metric.icon className="h-4 w-4" />
                  {metric.title}
                </div>
                {metric.change !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      metric.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                    }`}
                  >
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {metric.change >= 0 ? "+" : ""}
                    {metric.change}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold mt-2">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasAccounts && data?.topVideos?.length > 0 ? (
            <div className="space-y-3">
              {data.topVideos.map((post: any) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-3 bg-[#0a0a0a] rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{post.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(post.view_count || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(post.like_count || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {formatNumber(post.comment_count || 0)}
                      </span>
                      {post.video_url && (
                        <a
                          href={post.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ec4899] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <div className="text-center space-y-2">
                <Twitter className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">
                  {hasAccounts
                    ? "No X posts tracked yet"
                    : "Track X accounts to see analytics"}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Use the + button above to add an X/Twitter profile URL
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
