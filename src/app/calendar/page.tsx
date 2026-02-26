"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  // Generate calendar grid for current month
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

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
        <Button className="bg-[#ec4899] hover:bg-[#be185d] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">
            {month} {year}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {days.map((d) => (
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
              const isToday = day === now.getDate();
              return (
                <div
                  key={i}
                  className={`min-h-[80px] border border-white/5 p-1.5 ${
                    day ? "hover:bg-white/5 cursor-pointer" : "opacity-30"
                  }`}
                >
                  {day && (
                    <span
                      className={`text-xs ${
                        isToday
                          ? "bg-[#ec4899] text-white rounded-full w-6 h-6 flex items-center justify-center"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
