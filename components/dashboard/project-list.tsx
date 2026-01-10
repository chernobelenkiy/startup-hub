"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/project/project-status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Heart,
  FolderPlus,
} from "lucide-react";
import type { ProjectStatus } from "@/lib/db";

export interface ProjectListItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: ProjectStatus;
  likesCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectListProps {
  projects: ProjectListItem[];
  onEdit: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
  onCreate: () => void;
}

export function ProjectList({
  projects,
  onEdit,
  onDelete,
  onCreate,
}: ProjectListProps) {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FolderPlus className="size-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("noProjects")}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {t("createFirst")}
          </p>
          <Button onClick={onCreate}>
            <FolderPlus className="size-4 mr-2" />
            {t("createProject")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="group hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/projects/${project.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  <CardTitle className="text-base truncate">
                    {project.title}
                  </CardTitle>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <ProjectStatusBadge status={project.status} />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.slug}`}>
                      <ExternalLink className="size-4 mr-2" />
                      {t("viewProject")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Pencil className="size-4 mr-2" />
                    {tCommon("edit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(project)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4 mr-2" />
                    {tCommon("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-2 mb-4">
              {project.shortDescription}
            </CardDescription>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className="size-3" />
                <span>{project.likesCount}</span>
              </div>
              <time dateTime={project.updatedAt}>
                {new Date(project.updatedAt).toLocaleDateString()}
              </time>
            </div>
            {project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-surface-elevated rounded-full text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-xs bg-surface-elevated rounded-full text-muted-foreground">
                    +{project.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
