"use client";

import { Twitter, TrendingUp, Users, MessageCircle, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function XIntelligencePage() {
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Impressions", value: "0", icon: TrendingUp },
          { title: "Followers", value: "0", icon: Users },
          { title: "Replies", value: "0", icon: MessageCircle },
          { title: "Likes", value: "0", icon: Heart },
        ].map((metric) => (
          <Card key={metric.title} className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <metric.icon className="h-4 w-4" />
                {metric.title}
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
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
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center space-y-2">
              <Twitter className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-sm">
                Connect your X account to see analytics
              </p>
              <Badge className="bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/20">
                Connect Account
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
