"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusBadge } from "./project-status-badge";
import { LikeButton } from "./like-button";
import {
  ExternalLink,
  Calendar,
  Users,
  DollarSign,
  Pencil,
  Globe,
  TrendingUp,
} from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import type { ProjectStatus } from "@/lib/db";
import type { TeamMember } from "@/lib/validations/project";

interface ProjectDetailProps {
  project: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    pitch: string;
    screenshotUrl: string | null;
    websiteUrl: string | null;
    status: ProjectStatus;
    estimatedLaunch: string | null;
    traction: string | null;
    needsInvestment: boolean;
    investmentDetails: string | null;
    teamMembers: TeamMember[];
    lookingFor: string[];
    tags: string[];
    likesCount: number;
    isLiked?: boolean;
    language: string;
    createdAt: string;
    updatedAt: string;
    owner: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
  };
  isOwner: boolean;
  onEdit?: () => void;
}

const PREDEFINED_ROLES = ["developer", "designer", "marketer", "productManager", "cofounder", "investor", "advisor"] as const;
type PredefinedRole = typeof PREDEFINED_ROLES[number];

export function ProjectDetail({ project, isOwner, onEdit }: ProjectDetailProps) {
  const t = useTranslations("project");
  const tRoles = useTranslations("roles");

  const translateRole = (role: string): string => {
    if (PREDEFINED_ROLES.includes(role as PredefinedRole)) {
      return tRoles(role as PredefinedRole);
    }
    return role;
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-6">
        {project.screenshotUrl && (
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
            <img
              src={project.screenshotUrl}
              alt={`Screenshot of ${project.title}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-lg text-muted-foreground">
              {project.shortDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwner && onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Pencil className="size-4 mr-2" />
                {t("editProject")}
              </Button>
            )}
            {project.websiteUrl && (
              <Button asChild>
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="size-4 mr-2" />
                  {t("website")}
                  <ExternalLink className="size-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6 py-4 border-y border-border">
        <div className="flex items-center gap-2">
          <LikeButton
            projectId={project.id}
            initialLiked={project.isLiked ?? false}
            initialCount={project.likesCount}
            variant="full"
          />
          <span className="text-muted-foreground">{t("likes")}</span>
        </div>
        {project.estimatedLaunch && (
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <span className="text-muted-foreground">{t("estimatedLaunch")}:</span>
            <span className="font-medium">
              {new Date(project.estimatedLaunch).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {t("createdAt")}: {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pitch */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">{t("pitch")}</h2>
            </CardHeader>
            <CardContent>
              <Markdown content={project.pitch} />
            </CardContent>
          </Card>

          {/* Tags */}
          {project.tags.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">{t("tags")}</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Traction */}
          {project.traction && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-green-500" />
                  <h2 className="text-xl font-semibold">{t("traction")}</h2>
                </div>
              </CardHeader>
              <CardContent>
                <Markdown content={project.traction} />
              </CardContent>
            </Card>
          )}

          {/* Investment Info */}
          {project.needsInvestment && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="size-5 text-amber-500" />
                  <h2 className="text-xl font-semibold">{t("needsInvestment")}</h2>
                </div>
              </CardHeader>
              <CardContent>
                {project.investmentDetails ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.investmentDetails}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    This project is seeking investment.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Team */}
          {project.teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="size-5" />
                  <h2 className="text-lg font-semibold">{t("team")}</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Looking For */}
          {project.lookingFor.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">{t("lookingFor")}</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.lookingFor.map((role) => (
                    <Badge key={role} variant="outline" className="border-primary/30">
                      {translateRole(role)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owner Info */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Created by</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
                  {project.owner.name?.[0] || project.owner.email[0]}
                </div>
                <div>
                  <p className="font-medium">
                    {project.owner.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {project.owner.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
