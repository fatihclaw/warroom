"use client";

import { Video, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AllVideosPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-[#ec4899]" />
            All Videos
          </h1>
          <p className="text-sm text-muted-foreground">
            Every tracked video across all platforms
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            className="pl-9 bg-[#1a1a2e] border-white/10"
          />
        </div>
      </div>

      <Card className="bg-[#1a1a2e] border-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Video</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Views
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Performance
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Eng. Rate
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Likes
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Comments
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Shares
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Uploaded
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-16"
                >
                  No videos tracked yet. Add a URL from the dashboard to get
                  started.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
