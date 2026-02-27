"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddUrlDialog } from "@/components/add-url-dialog";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

interface Account {
  id: string;
  platform: string;
  username: string;
  display_name: string;
  avatar_url: string;
  follower_count: number;
  is_own_account: boolean;
  last_synced_at: string;
  created_at: string;
}

export default function AllAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  function fetchAccounts() {
    setLoading(true);
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function handleSync(account: Account) {
    setSyncing(account.id);
    try {
      await fetch(`/api/sync/${account.platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile",
          id: account.username,
          accountId: account.id,
        }),
      });
      fetchAccounts();
    } catch {
    } finally {
      setSyncing(null);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    fetchAccounts();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-[#ec4899]" />
            All Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            {accounts.length} accounts tracked
          </p>
        </div>
        <AddUrlDialog />
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
                  Last Synced
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-16"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-16"
                  >
                    No accounts tracked yet. Click &quot;Add URL&quot; to track
                    one.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((acc) => (
                  <TableRow key={acc.id} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {acc.avatar_url ? (
                          <img
                            src={acc.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#ec4899]/20 flex items-center justify-center text-xs font-bold text-[#ec4899]">
                            {acc.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {acc.display_name || acc.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{acc.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-[#ec4899]/30 text-[#ec4899]"
                      >
                        {acc.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(acc.follower_count)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {acc.last_synced_at
                        ? new Date(acc.last_synced_at).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleSync(acc)}
                          disabled={syncing === acc.id}
                        >
                          {syncing === acc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#ef4444] hover:text-[#ef4444]"
                          onClick={() => handleDelete(acc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
