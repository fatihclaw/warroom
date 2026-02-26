"use client";

import { Compass, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ExplorePage() {
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

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for accounts, topics, or niches..."
          className="pl-9 bg-[#1a1a2e] border-white/10 h-12 text-base"
        />
      </div>

      <Card className="bg-[#1a1a2e] border-white/5">
        <CardContent className="p-10 text-center">
          <Compass className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Search for accounts or browse trending creators in your niche
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
