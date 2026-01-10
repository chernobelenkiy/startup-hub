"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

type DashboardKey = "overview" | "projects" | "apiTokens" | "settings";
type CommonKey = "create" | "edit";

// Map of path segments to translation keys
const pathTranslations: Record<string, { namespace: "dashboard" | "common"; key: DashboardKey | CommonKey }> = {
  dashboard: { namespace: "dashboard", key: "overview" },
  projects: { namespace: "dashboard", key: "projects" },
  "api-tokens": { namespace: "dashboard", key: "apiTokens" },
  settings: { namespace: "dashboard", key: "settings" },
  create: { namespace: "common", key: "create" },
  edit: { namespace: "common", key: "edit" },
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const tDashboard = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");

  // Remove locale prefix and split into segments
  const segments = pathname
    .replace(/^\/(en|ru)/, "")
    .split("/")
    .filter(Boolean);

  // Build breadcrumb items
  const items: BreadcrumbItem[] = [
    { label: tNav("home"), href: "/" },
  ];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Get translation for this segment
    const translation = pathTranslations[segment];
    let label = segment;

    if (translation) {
      if (translation.namespace === "dashboard") {
        label = tDashboard(translation.key as DashboardKey);
      } else if (translation.namespace === "common") {
        label = tCommon(translation.key as CommonKey);
      }
    } else {
      // Capitalize and format unknown segments (like project IDs)
      label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    }

    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  if (items.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
                index === 0 && "text-muted-foreground"
              )}
            >
              {index === 0 && <Home className="size-4" />}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
