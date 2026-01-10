"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/db";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const statusStyles: Record<ProjectStatus, string> = {
  IDEA: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  MVP: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BETA: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LAUNCHED: "bg-green-500/20 text-green-400 border-green-500/30",
  PAUSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const t = useTranslations("projectStatus");

  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[status], className)}
    >
      {t(status)}
    </Badge>
  );
}
