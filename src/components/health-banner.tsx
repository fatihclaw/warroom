"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Settings, X } from "lucide-react";
import Link from "next/link";

interface ServiceStatus {
  fireworks: boolean;
  youtube: boolean;
  ollama: boolean;
}

export function HealthBanner() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/settings");
        const { settings } = await res.json();
        const hasFw =
          !!settings?.fireworks_api_key &&
          settings.fireworks_api_key !== "placeholder_add_later";
        const hasYt = !!settings?.youtube_api_key;

        // Check Ollama
        let ollamaUp = false;
        try {
          const ollamaRes = await fetch("http://localhost:11434/api/tags", {
            signal: AbortSignal.timeout(2000),
          });
          ollamaUp = ollamaRes.ok;
        } catch {
          // Ollama not running
        }

        setStatus({ fireworks: hasFw, youtube: hasYt, ollama: ollamaUp });
      } catch {
        // Settings fetch failed
      }
    }
    checkHealth();
  }, []);

  if (!status || dismissed) return null;

  const allGood = status.fireworks && status.youtube;
  if (allGood) return null;

  const warnings: string[] = [];
  if (!status.fireworks && !status.ollama) {
    warnings.push("AI features disabled — add Fireworks API key or start Ollama");
  }
  if (!status.youtube) {
    warnings.push("YouTube sync disabled — add YouTube API key");
  }

  if (warnings.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1 text-amber-200">
        {warnings.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <Link
        href="/settings"
        className="text-amber-500 hover:text-amber-400 flex items-center gap-1 text-xs shrink-0"
      >
        <Settings className="h-3 w-3" /> Settings
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500/60 hover:text-amber-500"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
