"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Radar,
  PenTool,
  CalendarDays,
  Bot,
  Twitter,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Eye,
  Video,
  Users,
  Compass,
  FolderHeart,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Trend Radar", href: "/research", icon: Radar },
  { name: "Command Center", href: "/content", icon: PenTool },
  { name: "Content Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Creator Agents", href: "/agents", icon: Bot },
  { name: "X Intelligence", href: "/x-intel", icon: Twitter },
];

const intelligenceSubNav = [
  { name: "Overview", href: "/intelligence", icon: Eye },
  { name: "All Videos", href: "/intelligence/videos", icon: Video },
  { name: "All Accounts", href: "/intelligence/accounts", icon: Users },
  { name: "Explore", href: "/intelligence/explore", icon: Compass },
  { name: "Collections", href: "/intelligence/collections", icon: FolderHeart },
];

export function Sidebar() {
  const pathname = usePathname();
  const [intelOpen, setIntelOpen] = useState(
    pathname.startsWith("/intelligence")
  );

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <Zap className="h-6 w-6 text-pink" />
        <span className="text-lg font-bold tracking-tight">WAR ROOM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {mainNav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-pink"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        {/* Intelligence (expandable) */}
        <div>
          <button
            onClick={() => setIntelOpen(!intelOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/intelligence")
                ? "bg-sidebar-accent text-pink"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="flex-1 text-left">Intelligence</span>
            {intelOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          {intelOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {intelligenceSubNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "text-pink"
                        : "text-muted-foreground hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
