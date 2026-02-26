"use client";

import { Settings, Key, Globe, Bell, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#ec4899]" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure your WAR ROOM
        </p>
      </div>

      {/* API Keys */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              YouTube Data API Key
            </label>
            <Input
              type="password"
              placeholder="AIza..."
              className="bg-[#0a0a0a] border-white/10"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              Fireworks AI API Key (Kimi K2.5)
            </label>
            <Input
              type="password"
              placeholder="fw_..."
              className="bg-[#0a0a0a] border-white/10"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              X/Twitter Bearer Token
            </label>
            <Input
              type="password"
              placeholder="AAAA..."
              className="bg-[#0a0a0a] border-white/10"
            />
          </div>
          <Button className="bg-[#ec4899] hover:bg-[#be185d] text-white">
            Save Keys
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["YouTube", "Instagram", "TikTok", "X/Twitter", "LinkedIn"].map(
            (platform) => (
              <div
                key={platform}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm">{platform}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10"
                >
                  Connect
                </Button>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              Telegram Bot Token
            </label>
            <Input
              type="password"
              placeholder="123456:ABC..."
              className="bg-[#0a0a0a] border-white/10"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              Telegram Chat ID
            </label>
            <Input
              placeholder="123456789"
              className="bg-[#0a0a0a] border-white/10"
            />
          </div>
          <Button className="bg-[#ec4899] hover:bg-[#be185d] text-white">
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
