"use client";

import { Users, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AllAccountsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-[#ec4899]" />
            All Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Tracked accounts across all platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              className="pl-9 bg-[#1a1a2e] border-white/10"
            />
          </div>
          <Button className="bg-[#ec4899] hover:bg-[#be185d] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Track Account
          </Button>
        </div>
      </div>

      <Card className="bg-[#1a1a2e] border-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Account</TableHead>
                <TableHead className="text-muted-foreground">
                  Platform
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Followers
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Avg Engagement
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Post Frequency
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Last Active
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-16"
                >
                  No accounts tracked yet. Click &quot;Track Account&quot; to
                  add one.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
