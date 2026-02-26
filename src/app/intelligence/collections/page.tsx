"use client";

import { FolderHeart, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CollectionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderHeart className="h-6 w-6 text-[#ec4899]" />
            Collections
          </h1>
          <p className="text-sm text-muted-foreground">
            Saved groups of content for reference and inspiration
          </p>
        </div>
        <Button className="bg-[#ec4899] hover:bg-[#be185d] text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-[#1a1a2e] border-white/5 border-dashed border-2 flex items-center justify-center min-h-[180px] cursor-pointer hover:border-[#ec4899]/30 transition-colors">
          <CardContent className="text-center p-6">
            <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Create your first collection
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
