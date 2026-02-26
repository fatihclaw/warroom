"use client";

import { Radar, TrendingUp, Music, Hash, Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ResearchPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radar className="h-6 w-6 text-[#ec4899]" />
            Trend Radar
          </h1>
          <p className="text-sm text-muted-foreground">
            What&apos;s going viral right now in your niche
          </p>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="bg-[#1a1a2e]">
          <TabsTrigger value="content">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Trending Content
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

        <TabsContent value="content" className="mt-6">
          <Card className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-10 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Start tracking accounts to discover trending content
              </p>
              <Badge className="mt-3 bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/20">
                Coming alive with data
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sounds" className="mt-6">
          <Card className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-10 text-center">
              <Music className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Trending sounds will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hashtags" className="mt-6">
          <Card className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-10 text-center">
              <Hash className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Trending hashtags will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formats" className="mt-6">
          <Card className="bg-[#1a1a2e] border-white/5">
            <CardContent className="p-10 text-center">
              <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Format trends will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
