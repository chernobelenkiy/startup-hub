"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Key,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/projects",
    labelKey: "projects",
    icon: FolderKanban,
  },
  {
    href: "/dashboard/settings/tokens",
    labelKey: "apiTokens",
    icon: Key,
  },
  {
    href: "/dashboard/settings",
    labelKey: "settings",
    icon: Settings,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // Remove locale prefix from pathname for comparison
  const normalizedPathname = pathname.replace(/^\/(en|ru)/, "");

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return normalizedPathname === "/dashboard";
    }
    return normalizedPathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-border min-h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!collapsed && (
          <Link href="/" className="text-lg font-bold text-primary">
            Startup Hub
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated",
                collapsed && "justify-center px-2"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <Icon className={cn("size-5 shrink-0", active && "text-primary")} aria-hidden="true" />
              {!collapsed && <span>{t(item.labelKey as "overview" | "projects" | "apiTokens" | "settings")}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className={cn(
        "p-4 border-t border-border",
        collapsed && "flex justify-center"
      )}>
        {collapsed ? (
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
            {user.name?.[0] || user.email?.[0] || "?"}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary shrink-0">
              {user.name?.[0] || user.email?.[0] || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
