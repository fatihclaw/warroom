"use client";

import {
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function IntelligenceOverview() {
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
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px] bg-[#1a1a2e] border-white/10">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all">All Accounts</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-platforms">
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
          <Select defaultValue="30d">
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
          <Button variant="outline" size="icon" className="border-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="border-white/10">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Total Views" value="0" change={0} icon={Eye} />
        <MetricCard title="Eng. Rate" value="0%" change={0} icon={BarChart3} />
        <MetricCard title="Likes" value="0" change={0} icon={ThumbsUp} />
        <MetricCard
          title="Comments"
          value="0"
          change={0}
          icon={MessageCircle}
        />
        <MetricCard title="Shares" value="0" change={0} icon={Share2} />
        <MetricCard title="Saves" value="0" change={0} icon={Bookmark} />
      </div>

      {/* Views Over Time + Virality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Views Over Time
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-[#ec4899]"
              >
                Daily
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground"
              >
                Cumulative
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
              Add tracked accounts to see view trends
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Virality Median Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
              Track videos to see virality distribution
            </div>
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
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              No videos tracked yet
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duration Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Track videos to see optimal length
            </div>
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
              <div className="text-sm text-muted-foreground text-center py-8">
                No data available yet
              </div>
            </TabsContent>
            <TabsContent value="by-day" className="mt-4">
              <div className="text-sm text-muted-foreground text-center py-8">
                No data available yet
              </div>
            </TabsContent>
            <TabsContent value="upload-activity" className="mt-4">
              <div className="text-sm text-muted-foreground text-center py-8">
                No data available yet
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
