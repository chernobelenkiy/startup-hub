"use client";

import { useTranslations } from "next-intl";
import { Users, Globe } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusBadge } from "./project-status-badge";
import { LikeButton } from "./like-button";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/db";

interface ProjectCardProps {
  project: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    screenshotUrl: string | null;
    websiteUrl: string | null;
    status: ProjectStatus;
    tags: string[];
    lookingFor: string[];
    likesCount: number;
    teamMembers: unknown[];
    isLiked?: boolean;
  };
  className?: string;
}

/** Maximum number of tags to display before showing "+N more" */
const MAX_VISIBLE_TAGS = 3;
/** Maximum number of roles to display */
const MAX_VISIBLE_ROLES = 2;

/**
 * Generates a deterministic gradient based on project ID
 * Used as placeholder when no screenshot is available
 */
function getPlaceholderGradient(id: string): string {
  const gradients = [
    "from-emerald-600/30 via-green-700/20 to-teal-800/30",
    "from-blue-600/30 via-indigo-700/20 to-purple-800/30",
    "from-amber-600/30 via-orange-700/20 to-red-800/30",
    "from-pink-600/30 via-rose-700/20 to-red-800/30",
    "from-cyan-600/30 via-blue-700/20 to-indigo-800/30",
    "from-violet-600/30 via-purple-700/20 to-fuchsia-800/30",
  ];

  // Simple hash function to pick gradient based on ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash = hash & hash;
  }

  return gradients[Math.abs(hash) % gradients.length];
}

const PREDEFINED_ROLES = ["developer", "designer", "marketer", "productManager", "cofounder", "investor", "advisor"] as const;
type PredefinedRole = typeof PREDEFINED_ROLES[number];

export function ProjectCard({ project, className }: ProjectCardProps) {
  const t = useTranslations();
  const tRoles = useTranslations("roles");

  const translateRole = (role: string): string => {
    if (PREDEFINED_ROLES.includes(role as PredefinedRole)) {
      return tRoles(role as PredefinedRole);
    }
    return role;
  };

  const visibleTags = project.tags.slice(0, MAX_VISIBLE_TAGS);
  const remainingTagsCount = project.tags.length - MAX_VISIBLE_TAGS;
  const visibleRoles = project.lookingFor.slice(0, MAX_VISIBLE_ROLES);
  const remainingRolesCount = project.lookingFor.length - MAX_VISIBLE_ROLES;
  const teamSize = Array.isArray(project.teamMembers)
    ? project.teamMembers.length
    : 0;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group block rounded-lg border border-border bg-[#111611] overflow-hidden",
        "transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        "hover:-translate-y-0.5",
        className
      )}
    >
      {/* Screenshot / Placeholder */}
      <div className="relative aspect-video w-full overflow-hidden">
        {project.screenshotUrl ? (
          <img
            src={project.screenshotUrl}
            alt={`Screenshot of ${project.title}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "h-full w-full bg-gradient-to-br",
              getPlaceholderGradient(project.id)
            )}
          />
        )}

        {/* Status badge overlay */}
        <div className="absolute left-3 top-3">
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {project.title}
        </h3>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-sm text-muted">
          {project.shortDescription}
        </p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary text-xs"
              >
                {tag}
              </Badge>
            ))}
            {remainingTagsCount > 0 && (
              <Badge
                variant="outline"
                className="border-border bg-surface-elevated text-muted text-xs"
              >
                +{remainingTagsCount}
              </Badge>
            )}
          </div>
        )}

        {/* Looking for roles */}
        {project.lookingFor.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">
              {t("project.lookingFor")}:
            </span>
            {visibleRoles.map((role) => (
              <Badge
                key={role}
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs"
              >
                {translateRole(role)}
              </Badge>
            ))}
            {remainingRolesCount > 0 && (
              <Badge
                variant="outline"
                className="border-border bg-surface-elevated text-muted text-xs"
              >
                +{remainingRolesCount}
              </Badge>
            )}
          </div>
        )}

        {/* Footer: Team size, website, and likes */}
        <div className="flex items-center justify-between pt-2 border-t border-border-muted">
          {/* Team size */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted" aria-label={`Team size: ${teamSize} members`}>
              <Users className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">{teamSize}</span>
            </div>

            {/* Website link */}
            {project.websiteUrl && (
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center text-muted hover:text-primary transition-colors"
                aria-label="Visit website"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Interactive Like Button */}
          <LikeButton
            projectId={project.id}
            initialLiked={project.isLiked ?? false}
            initialCount={project.likesCount}
            variant="icon"
          />
        </div>
      </div>
    </Link>
  );
}
