"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Inbox, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  hasFilters: boolean;
  className?: string;
}

/**
 * Empty state component for when no projects match filters
 * Shows different messages based on whether filters are active
 */
export function EmptyState({ hasFilters, className }: EmptyStateProps) {
  const t = useTranslations();
  const { data: session } = useSession();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {/* Icon */}
      <div className="mb-6 rounded-full bg-surface-elevated p-4">
        {hasFilters ? (
          <Search className="h-8 w-8 text-muted" />
        ) : (
          <Inbox className="h-8 w-8 text-muted" />
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {hasFilters
          ? t("emptyState.noMatchingProjects")
          : t("emptyState.noProjectsYet")}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-muted">
        {hasFilters
          ? t("emptyState.noMatchingDescription")
          : t("emptyState.noProjectsDescription")}
      </p>

      {/* Suggestions for filters */}
      {hasFilters && (
        <div className="mb-6 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">{t("emptyState.suggestions")}:</p>
          <ul className="list-disc list-inside text-left space-y-1">
            <li>{t("emptyState.suggestionBroaden")}</li>
            <li>{t("emptyState.suggestionClearFilters")}</li>
            <li>{t("emptyState.suggestionDifferentSearch")}</li>
          </ul>
        </div>
      )}

      {/* CTA to create project (if logged in) */}
      {session?.user && (
        <Button asChild>
          <Link href="/dashboard/projects">
            <Plus className="mr-2 h-4 w-4" />
            {t("project.createProject")}
          </Link>
        </Button>
      )}

      {/* CTA to sign in (if not logged in and no projects) */}
      {!session?.user && !hasFilters && (
        <Button asChild>
          <Link href="/auth/login">
            {t("navigation.signIn")}
          </Link>
        </Button>
      )}
    </div>
  );
}
