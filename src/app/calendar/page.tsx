"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const platformColors: Record<string, string> = {
  youtube: "bg-red-500/80",
  tiktok: "bg-cyan-500/80",
  instagram: "bg-purple-500/80",
  twitter: "bg-blue-500/80",
  linkedin: "bg-blue-700/80",
};

interface ScheduledPost {
  id: string;
  platform: string;
  scheduled_at: string;
  status: string;
  content: { title?: string; caption?: string; text?: string };
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // New post form
  const [newPlatform, setNewPlatform] = useState("youtube");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [newTitle, setNewTitle] = useState("");
  const [newCaption, setNewCaption] = useState("");

  const month = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const monthStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  function fetchPosts() {
    setLoading(true);
    fetch(`/api/publishing?month=${monthStr}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchPosts();
  }, [monthStr]);

  function prevMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  }

  // Generate calendar grid
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const now = new Date();
  const isCurrentMonth =
    now.getMonth() === currentDate.getMonth() &&
    now.getFullYear() === currentDate.getFullYear();

  function getPostsForDay(day: number): ScheduledPost[] {
    return posts.filter((p) => {
      const d = new Date(p.scheduled_at);
      return d.getDate() === day;
    });
  }

  async function handleSchedule() {
    if (!newDate || !newTime) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(`${newDate}T${newTime}:00`).toISOString();
      await fetch("/api/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newPlatform,
          scheduledAt,
          content: {
            title: newTitle,
            caption: newCaption,
          },
        }),
      });
      setDialogOpen(false);
      setNewTitle("");
      setNewCaption("");
      fetchPosts();
    } catch {
    } finally {
      setScheduling(false);
    }
  }

  function clickDay(day: number) {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setNewDate(dateStr);
    setDialogOpen(true);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-[#ec4899]" />
            Content Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule and manage your publishing pipeline
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#ec4899] hover:bg-[#be185d] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Post
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a2e] border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule a Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Platform
                </label>
                <Select value={newPlatform} onValueChange={setNewPlatform}>
                  <SelectTrigger className="bg-[#0a0a0a] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">X/Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="bg-[#0a0a0a] border-white/10"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="bg-[#0a0a0a] border-white/10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Title
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Post title..."
                  className="bg-[#0a0a0a] border-white/10"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Caption / Notes
                </label>
                <Textarea
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Caption or content notes..."
                  className="bg-[#0a0a0a] border-white/10 min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleSchedule}
                disabled={!newDate || scheduling}
                className="w-full bg-[#ec4899] hover:bg-[#be185d] text-white"
              >
                {scheduling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">
            {month} {year}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const isToday = isCurrentMonth && day === now.getDate();
              const dayPosts = day ? getPostsForDay(day) : [];
              return (
                <div
                  key={i}
                  className={`min-h-[90px] border border-white/5 p-1.5 ${
                    day
                      ? "hover:bg-white/5 cursor-pointer"
                      : "opacity-30"
                  }`}
                  onClick={() => day && clickDay(day)}
                >
                  {day && (
                    <>
                      <span
                        className={`text-xs ${
                          isToday
                            ? "bg-[#ec4899] text-white rounded-full w-6 h-6 flex items-center justify-center"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayPosts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${
                              platformColors[post.platform] || "bg-gray-500/80"
                            }`}
                          >
                            {post.content?.title || post.platform}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <p className="text-[10px] text-muted-foreground">
                            +{dayPosts.length - 3} more
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Upcoming Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.filter((p) => p.status === "pending").length > 0 ? (
            <div className="space-y-2">
              {posts
                .filter((p) => p.status === "pending")
                .map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`text-white text-xs ${
                          platformColors[post.platform] || "bg-gray-500/80"
                        }`}
                      >
                        {post.platform}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {post.content?.title || "Untitled post"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-[#f59e0b]/30 text-[#f59e0b] text-xs"
                    >
                      {post.status}
                    </Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No upcoming posts scheduled. Click a date or "Schedule Post" to
              add one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
