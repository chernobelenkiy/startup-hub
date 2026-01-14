"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";
import type { CreateProjectWithTranslationsInput, TeamMember } from "@/lib/validations/project";
import type { ProjectListItem } from "@/components/dashboard/project-list";
import { Loader2 } from "lucide-react";

interface EditProjectModalProps {
  project: ProjectListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ProjectTranslation {
  id: string;
  projectId: string;
  language: string;
  title: string;
  shortDescription: string;
  pitch: string;
  traction: string | null;
  investmentDetails: string | null;
}

interface FullProject {
  id: string;
  slug: string;
  title: string | null;
  shortDescription: string | null;
  pitch: string | null;
  websiteUrl: string | null;
  screenshotUrl: string | null;
  status: "IDEA" | "MVP" | "BETA" | "LAUNCHED" | "PAUSED";
  estimatedLaunch: string | null;
  traction: string | null;
  needsInvestment: boolean;
  investmentDetails: string | null;
  teamMembers: TeamMember[];
  lookingFor: string[];
  tags: string[];
  language: "en" | "ru";
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  translations: ProjectTranslation[];
}

export function EditProjectModal({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectModalProps) {
  const t = useTranslations("project");
  const tErrors = useTranslations("errors");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fullProject, setFullProject] = useState<FullProject | null>(null);

  // Fetch full project data when modal opens
  useEffect(() => {
    if (open && project.id) {
      fetchProject();
    }
  }, [open, project.id]);

  const fetchProject = async () => {
    setIsFetching(true);
    setFullProject(null);
    try {
      const response = await fetch(`/api/projects/${project.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Fetch project error:", response.status, errorData);
        toast.error(errorData.error || tErrors("serverError"));
        return;
      }
      const data = await response.json();
      setFullProject(data.project);
    } catch (error) {
      console.error("Fetch project error:", error);
      toast.error(tErrors("serverError"));
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (data: CreateProjectWithTranslationsInput & { screenshotUrl?: string | null }) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project");
      }

      toast.success(t("projectUpdated"));
      onSuccess();
    } catch (error) {
      console.error("Update project error:", error);
      toast.error(tErrors("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editProject")}</DialogTitle>
          <DialogDescription>
            Update the details of your project.
          </DialogDescription>
        </DialogHeader>
        {isFetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : fullProject ? (
          <ProjectForm
            initialData={{
              // Non-translatable fields
              websiteUrl: fullProject.websiteUrl,
              screenshotUrl: fullProject.screenshotUrl,
              status: fullProject.status,
              estimatedLaunch: fullProject.estimatedLaunch
                ? new Date(fullProject.estimatedLaunch)
                : null,
              needsInvestment: fullProject.needsInvestment,
              teamMembers: fullProject.teamMembers,
              lookingFor: fullProject.lookingFor,
              tags: fullProject.tags,
              // Pass translations array for the form to populate both languages
              translations: fullProject.translations,
              // Legacy fields for backward compatibility
              title: fullProject.title || "",
              shortDescription: fullProject.shortDescription || "",
              pitch: fullProject.pitch || "",
              traction: fullProject.traction,
              investmentDetails: fullProject.investmentDetails,
              language: fullProject.language,
            }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel={t("editProject")}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">Failed to load project data</p>
            <button
              onClick={fetchProject}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
