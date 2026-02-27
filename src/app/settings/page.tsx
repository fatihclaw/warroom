"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Key,
  Globe,
  Bell,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Local input values (not masked)
  const [youtubeKey, setYoutubeKey] = useState("");
  const [fireworksKey, setFireworksKey] = useState("");
  const [twitterToken, setTwitterToken] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChat, setTelegramChat] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
        }
      })
      .catch(() => {});
  }, []);

  async function saveKey(key: string, value: string) {
    if (!value.trim()) return;
    setSaving(key);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: value.trim() }),
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch {
    } finally {
      setSaving(null);
    }
  }

  function SaveButton({ keyName, value }: { keyName: string; value: string }) {
    return (
      <Button
        onClick={() => saveKey(keyName, value)}
        disabled={!value.trim() || saving === keyName}
        className="bg-[#ec4899] hover:bg-[#be185d] text-white"
        size="sm"
      >
        {saving === keyName ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : saved === keyName ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
      </Button>
    );
  }

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
            <div className="flex gap-2">
              <Input
                type="password"
                value={youtubeKey}
                onChange={(e) => setYoutubeKey(e.target.value)}
                placeholder={settings.youtube_api_key || "AIza..."}
                className="bg-[#0a0a0a] border-white/10"
              />
              <SaveButton keyName="youtube_api_key" value={youtubeKey} />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              Fireworks AI API Key (for Kimi K2.5)
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={fireworksKey}
                onChange={(e) => setFireworksKey(e.target.value)}
                placeholder={settings.fireworks_api_key || "fw_..."}
                className="bg-[#0a0a0a] border-white/10"
              />
              <SaveButton keyName="fireworks_api_key" value={fireworksKey} />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              X/Twitter Bearer Token
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={twitterToken}
                onChange={(e) => setTwitterToken(e.target.value)}
                placeholder={settings.twitter_bearer_token || "AAAA..."}
                className="bg-[#0a0a0a] border-white/10"
              />
              <SaveButton keyName="twitter_bearer_token" value={twitterToken} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Telegram Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              Telegram Bot Token
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder={settings.telegram_bot_token || "123456:ABC..."}
                className="bg-[#0a0a0a] border-white/10"
              />
              <SaveButton keyName="telegram_bot_token" value={telegramToken} />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">
              Telegram Chat ID
            </label>
            <div className="flex gap-2">
              <Input
                value={telegramChat}
                onChange={(e) => setTelegramChat(e.target.value)}
                placeholder={settings.telegram_chat_id || "123456789"}
                className="bg-[#0a0a0a] border-white/10"
              />
              <SaveButton keyName="telegram_chat_id" value={telegramChat} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card className="bg-[#1a1a2e] border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Supabase</span>
            <span className="text-[#22c55e] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />
              Connected
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">AI (Kimi K2.5)</span>
            <span
              className={`flex items-center gap-1 ${
                settings.fireworks_api_key
                  ? "text-[#22c55e]"
                  : "text-[#f59e0b]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  settings.fireworks_api_key ? "bg-[#22c55e]" : "bg-[#f59e0b]"
                }`}
              />
              {settings.fireworks_api_key ? "Configured" : "Not configured"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">YouTube API</span>
            <span
              className={`flex items-center gap-1 ${
                settings.youtube_api_key
                  ? "text-[#22c55e]"
                  : "text-[#f59e0b]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  settings.youtube_api_key ? "bg-[#22c55e]" : "bg-[#f59e0b]"
                }`}
              />
              {settings.youtube_api_key ? "Configured" : "Not configured"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
